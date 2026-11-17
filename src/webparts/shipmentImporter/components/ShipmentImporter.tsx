import * as React from 'react';
import styles from './ShipmentImporter.module.scss';
import { Section } from '../../../common/components/Section';
import { safeLink } from '../../../common/links';
import { readSpreadsheet, type Rows } from '../utils/spreadsheet';
import { autoMap, FIELDS, parseEta, templateCsv, validateRows, type ColumnMapping, type FieldKey, type IImportShipment } from '../utils/mapping';
import type { IImportResult, ImportService } from '../services/ImportService';

/** A flagged row's cell as the person would recognise it: Excel dates shown as dates, not day numbers. */
function previewCell(row: Rows[number], mapping: ColumnMapping, key: FieldKey): string {
  if (mapping[key] < 0) {
    return '';
  }
  const raw = row[mapping[key]] ?? '';
  return (key === 'eta' && parseEta(raw)) || String(raw);
}

export interface IShipmentImporterProps {
  eyebrow?: string;
  title?: string;
  accent?: string;
  listTitle?: string;
  /** Undefined when no list is set: the importer then only checks files. */
  service?: ImportService;
  boardUrl?: string;
}

type Step = 'pick' | 'review' | 'importing' | 'done';

const PREVIEW_ROWS = 50;

const ShipmentImporter: React.FC<IShipmentImporterProps> = ({ eyebrow, title, accent, listTitle, service, boardUrl }) => {
  const [step, setStep] = React.useState<Step>('pick');
  const [fileName, setFileName] = React.useState('');
  const [rows, setRows] = React.useState<Rows>([]);
  const [mapping, setMapping] = React.useState<ColumnMapping | undefined>(undefined);
  const [readError, setReadError] = React.useState<string | undefined>(undefined);
  const [dragging, setDragging] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [result, setResult] = React.useState<IImportResult | undefined>(undefined);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const headers = rows[0] || [];
  const dataRows = React.useMemo(() => rows.slice(1), [rows]);
  const results = React.useMemo(() => (mapping ? validateRows(dataRows, mapping) : []), [dataRows, mapping]);
  const ready = results.filter((r) => r.shipment);
  const problems = results.filter((r) => !r.shipment);

  const templateHref = React.useMemo(() => URL.createObjectURL(new Blob([templateCsv()], { type: 'text/csv' })), []);
  React.useEffect(() => () => URL.revokeObjectURL(templateHref), [templateHref]);

  const reset = (): void => {
    setStep('pick');
    setRows([]);
    setMapping(undefined);
    setFileName('');
    setResult(undefined);
    setProgress(0);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const openFile = async (file: File | undefined): Promise<void> => {
    if (!file) {
      return;
    }
    setReadError(undefined);
    try {
      const parsed = await readSpreadsheet(file);
      if (parsed.length < 2) {
        throw new Error('This sheet has no rows under the header row.');
      }
      setRows(parsed);
      setMapping(autoMap(parsed[0]));
      setFileName(file.name);
      setStep('review');
    } catch (e) {
      setReadError((e as Error).message);
    }
  };

  const runImport = async (): Promise<void> => {
    if (!service) {
      return;
    }
    setStep('importing');
    setProgress(0);
    try {
      const r = await service.importRows(
        ready.map((x) => x.shipment as IImportShipment),
        (done) => setProgress(done)
      );
      setResult(r);
    } catch (e) {
      setResult({ added: 0, updated: 0, failed: [{ reference: 'All rows', message: (e as Error).message }] });
    }
    setStep('done');
  };

  const setColumn = (key: FieldKey, index: number): void => setMapping((m) => (m ? { ...m, [key]: index } : m));
  const board = safeLink(boardUrl);

  return (
    <Section eyebrow={eyebrow} title={title} accent={accent} anchor="import">
      <ol className={styles.steps} aria-label="Import steps">
        {['Choose a file', 'Check the data', 'Import'].map((label, i) => {
          const current = step === 'pick' ? 0 : step === 'review' ? 1 : 2;
          return (
            <li key={label} className={i === current ? styles.stepCurrent : i < current ? styles.stepDone : styles.step} aria-current={i === current ? 'step' : undefined}>
              <span className={styles.stepNumber}>{i < current ? '✓' : `0${i + 1}`}</span>
              {label}
            </li>
          );
        })}
      </ol>

      {step === 'pick' && (
        <>
          <label
            className={`${styles.drop} ${dragging ? styles.dragging : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              openFile(e.dataTransfer.files[0]).catch(() => undefined);
            }}
          >
            <span className={styles.dropTitle}>
              Drop the shipments spreadsheet here, or <u>choose a file</u>
            </span>
            <span className={styles.muted}>Excel (.xlsx) or CSV. The first row should be the column names.</span>
            <input
              ref={inputRef}
              className={styles.srOnly}
              type="file"
              accept=".xlsx,.csv"
              onChange={(e) => {
                openFile(e.target.files?.[0]).catch(() => undefined);
              }}
            />
          </label>
          {readError && (
            <p className={styles.error} role="alert">
              {readError}
            </p>
          )}
          <p className={styles.muted}>
            Not sure what columns to use?{' '}
            <a className={styles.link} href={templateHref} download="shipments-template.csv">
              Download a template
            </a>
            .
          </p>
          {!service && <p className={styles.notice}>No list is set in the web part settings, so this will check files without importing them.</p>}
        </>
      )}

      {step === 'review' && mapping && (
        <>
          <div className={styles.summary}>
            <span className={styles.fileName}>{fileName}</span>
            <span>
              {dataRows.length} rows · <strong className={styles.okText}>{ready.length} ready</strong>
              {problems.length > 0 && (
                <>
                  {' '}
                  · <strong className={styles.badText}>{problems.length} need fixing</strong>
                </>
              )}
            </span>
          </div>

          <fieldset className={styles.mapping}>
            <legend>Match the columns</legend>
            {FIELDS.map((f) => (
              <label key={f.key} className={styles.mapField}>
                <span>
                  {f.label}
                  {f.required && <span aria-hidden="true"> *</span>}
                </span>
                <select value={mapping[f.key]} onChange={(e) => setColumn(f.key, Number(e.target.value))} required={f.required}>
                  <option value={-1}>{f.required ? '— choose a column —' : '— not in this file —'}</option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>
                      {String(h) || `Column ${i + 1}`}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </fieldset>

          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <caption className={styles.srOnly}>Preview of the rows to import</caption>
              <thead>
                <tr>
                  <th scope="col">Row</th>
                  {FIELDS.map((f) => (
                    <th key={f.key} scope="col">
                      {f.label}
                    </th>
                  ))}
                  <th scope="col">Check</th>
                </tr>
              </thead>
              <tbody>
                {results.slice(0, PREVIEW_ROWS).map((r) => (
                  <tr key={r.rowNumber} className={r.shipment ? undefined : styles.badRow}>
                    <td className={styles.mono}>{r.rowNumber}</td>
                    {FIELDS.map((f) => (
                      <td key={f.key} className={f.key === 'eta' ? styles.nowrap : undefined}>
                        {r.shipment ? r.shipment[f.key] : previewCell(dataRows[r.rowNumber - 2], mapping, f.key)}
                      </td>
                    ))}
                    <td>{r.shipment ? <span className={styles.okChip}>Ready</span> : <span className={styles.badText}>{r.errors.join('. ')}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {results.length > PREVIEW_ROWS && <p className={styles.muted}>Showing the first {PREVIEW_ROWS} of {results.length} rows. All rows are checked.</p>}
          </div>

          <div className={styles.actions}>
            {service ? (
              <button type="button" className={styles.primary} disabled={ready.length === 0} onClick={() => runImport().catch(() => undefined)}>
                Import {ready.length} {ready.length === 1 ? 'shipment' : 'shipments'} into {listTitle}
              </button>
            ) : (
              <p className={styles.notice}>Checked only. Set a list in the web part settings to import.</p>
            )}
            <button type="button" className={styles.secondary} onClick={reset}>
              Choose another file
            </button>
            {problems.length > 0 && service && <span className={styles.muted}>Rows that need fixing are skipped.</span>}
          </div>
        </>
      )}

      {step === 'importing' && (
        <div className={styles.progressWrap} aria-live="polite">
          <p>
            Importing {progress} of {ready.length}…
          </p>
          <progress className={styles.progress} max={ready.length} value={progress} />
        </div>
      )}

      {step === 'done' && result && (
        <div aria-live="polite">
          <div className={styles.resultGrid}>
            <div className={styles.resultTile}>
              <span className={styles.resultValue}>{result.added}</span>
              <span>added</span>
            </div>
            <div className={styles.resultTile}>
              <span className={styles.resultValue}>{result.updated}</span>
              <span>updated</span>
            </div>
            <div className={`${styles.resultTile} ${result.failed.length ? styles.resultBad : ''}`}>
              <span className={styles.resultValue}>{result.failed.length}</span>
              <span>failed</span>
            </div>
          </div>
          {result.failed.length > 0 && (
            <ul className={styles.failures}>
              {result.failed.map((f, i) => (
                <li key={i}>
                  <strong>{f.reference}</strong>: {f.message}
                </li>
              ))}
            </ul>
          )}
          <div className={styles.actions}>
            {board && (
              <a className={styles.primary} href={board}>
                See it on the dispatch board <span aria-hidden="true">→</span>
              </a>
            )}
            <button type="button" className={styles.secondary} onClick={reset}>
              Import another file
            </button>
          </div>
        </div>
      )}
    </Section>
  );
};

export default ShipmentImporter;
