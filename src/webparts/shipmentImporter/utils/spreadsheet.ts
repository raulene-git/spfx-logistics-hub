/**
 * Reads the first sheet of an .xlsx file, or a .csv file, into rows of cells.
 *
 * No library: an .xlsx file is a zip of XML files. This finds the entries in the zip,
 * unzips them with the browser's built-in DecompressionStream, and reads the XML with DOMParser.
 */

export type Cell = string | number;
export type Rows = Cell[][];

export async function readSpreadsheet(file: File): Promise<Rows> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv')) {
    return parseCsv(await file.text());
  }
  if (name.endsWith('.xlsx')) {
    return readXlsx(await file.arrayBuffer());
  }
  throw new Error('Use an Excel workbook (.xlsx) or a CSV file. Older .xls files need saving as .xlsx first.');
}

// ---------- CSV ----------

/** RFC 4180-style CSV: quoted fields, doubled quotes, commas and newlines inside quotes. */
export function parseCsv(text: string): Rows {
  const rows: Rows = [];
  let row: Cell[] = [];
  let field = '';
  let quoted = false;
  const src = text.replace(/^﻿/, '');

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') {
        i++;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ''));
}

// ---------- XLSX ----------

interface IZipEntry {
  method: number;
  compressedSize: number;
  localOffset: number;
}

function readZipDirectory(buf: ArrayBuffer): Record<string, IZipEntry> {
  const view = new DataView(buf);
  // The end-of-central-directory record is in the last 64 KB.
  let eocd = -1;
  for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) {
    throw new Error("This file isn't a valid Excel workbook.");
  }

  const count = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);
  const decoder = new TextDecoder();
  const entries: Record<string, IZipEntry> = {};

  for (let n = 0; n < count; n++) {
    if (view.getUint32(offset, true) !== 0x02014b50) {
      throw new Error("This file isn't a valid Excel workbook.");
    }
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const name = decoder.decode(new Uint8Array(buf, offset + 46, nameLength));
    entries[name] = { method, compressedSize, localOffset };
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

async function readZipText(buf: ArrayBuffer, entry: IZipEntry): Promise<string> {
  const view = new DataView(buf);
  const nameLength = view.getUint16(entry.localOffset + 26, true);
  const extraLength = view.getUint16(entry.localOffset + 28, true);
  const start = entry.localOffset + 30 + nameLength + extraLength;
  const data = new Uint8Array(buf, start, entry.compressedSize);

  if (entry.method === 0) {
    return new TextDecoder().decode(data);
  }
  if (entry.method !== 8) {
    throw new Error('This workbook uses a compression type that can’t be read here.');
  }
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Response(stream).text();
}

function parseXml(text: string): Document {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) {
    throw new Error('Part of this workbook could not be read.');
  }
  return doc;
}

/** "C" -> 2, "AA" -> 26 */
export function columnIndex(ref: string): number {
  const letters = (/^[A-Z]+/.exec(ref) || [''])[0];
  let n = 0;
  for (let i = 0; i < letters.length; i++) {
    n = n * 26 + (letters.charCodeAt(i) - 64);
  }
  return n - 1;
}

function textOf(el: Element): string {
  const parts = el.getElementsByTagName('t');
  let s = '';
  for (let i = 0; i < parts.length; i++) {
    s += parts[i].textContent || '';
  }
  return s;
}

export async function readXlsx(buf: ArrayBuffer): Promise<Rows> {
  const entries = readZipDirectory(buf);
  const get = async (path: string): Promise<Document | undefined> => (entries[path] ? parseXml(await readZipText(buf, entries[path])) : undefined);

  // Find the first sheet's file through the workbook and its relationships.
  const workbook = await get('xl/workbook.xml');
  const rels = await get('xl/_rels/workbook.xml.rels');
  const firstSheet = workbook?.getElementsByTagName('sheet')[0];
  const relId = firstSheet?.getAttribute('r:id');
  let target = 'worksheets/sheet1.xml';
  if (rels && relId) {
    const all = rels.getElementsByTagName('Relationship');
    for (let i = 0; i < all.length; i++) {
      if (all[i].getAttribute('Id') === relId) {
        target = (all[i].getAttribute('Target') || target).replace(/^\/?xl\//, '');
      }
    }
  }
  const sheet = await get(`xl/${target}`);
  if (!sheet) {
    throw new Error("Couldn't find a sheet in this workbook.");
  }

  const sharedDoc = await get('xl/sharedStrings.xml');
  const shared: string[] = [];
  if (sharedDoc) {
    const items = sharedDoc.getElementsByTagName('si');
    for (let i = 0; i < items.length; i++) {
      shared.push(textOf(items[i]));
    }
  }

  const rows: Rows = [];
  const rowEls = sheet.getElementsByTagName('row');
  for (let r = 0; r < rowEls.length; r++) {
    const row: Cell[] = [];
    const cells = rowEls[r].getElementsByTagName('c');
    for (let c = 0; c < cells.length; c++) {
      const cell = cells[c];
      const index = columnIndex(cell.getAttribute('r') || '');
      const type = cell.getAttribute('t');
      const raw = cell.getElementsByTagName('v')[0]?.textContent ?? '';
      let value: Cell;
      if (type === 's') {
        value = shared[Number(raw)] ?? '';
      } else if (type === 'inlineStr') {
        value = textOf(cell);
      } else if (type === 'str' || type === 'b' || type === 'e') {
        value = raw;
      } else {
        value = raw === '' ? '' : Number(raw);
      }
      row[index >= 0 ? index : row.length] = value;
    }
    for (let i = 0; i < row.length; i++) {
      if (row[i] === undefined) {
        row[i] = '';
      }
    }
    if (row.some((v) => String(v).trim() !== '')) {
      rows.push(row);
    }
  }
  return rows;
}
