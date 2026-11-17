"""Writes demo-data/shipments-weekly.xlsx: a realistic, slightly messy weekly sheet for testing the Shipment Importer.

Standard library only (an .xlsx file is a zip of XML). Run:  python scripts/make-sample-xlsx.py
Headers use everyday names the importer should match on its own; ETAs are real Excel dates;
three rows are deliberately wrong so the checking step has something to show.
"""
import datetime
import pathlib
import zipfile
from xml.sax.saxutils import escape

HEADERS = ["Consignment Ref", "Client", "Collect From", "Deliver To", "Haulier", "State", "Due Date"]

ROWS = [
    ["CN-10421", "Northwind Retail", "Birmingham DC", "Leeds", "Road (in-house)", "Delivered", datetime.date(2026, 11, 18)],
    ["CN-10431", "Contoso Foods", "Bristol Hub", "Swansea", "Road (partner)", "booked", datetime.date(2026, 11, 24)],
    ["CN-10432", "Tailspin Toys", "Felixstowe Port", "Norwich", "Road (partner)", "in-transit", datetime.date(2026, 11, 19)],
    ["CN-10433", "Adventure Works", "Glasgow Hub", "Dundee", "Road (in-house)", "Out for delivery", datetime.date(2026, 11, 18)],
    ["CN-10434", "Fabrikam Garden", "Southampton Port", "Oxford", "Rail freight", "On hold", datetime.date(2026, 11, 20)],
    ["CN-10435", "Northwind Retail", "Birmingham DC", "Sheffield", "Road (in-house)", "", datetime.date(2026, 11, 25)],
    # Deliberate problems:
    ["CN-10436", "", "Bristol Hub", "Bath", "Road (partner)", "Booked", datetime.date(2026, 11, 26)],  # no customer
    ["CN-10437", "Contoso Foods", "Bristol Hub", "Plymouth", "Road (partner)", "Lost", datetime.date(2026, 11, 27)],  # unknown status
    ["CN-10431", "Contoso Foods", "Bristol Hub", "Swansea", "Road (partner)", "Booked", "next week"],  # duplicate + bad date
]


def excel_serial(d: datetime.date) -> int:
    return (d - datetime.date(1899, 12, 30)).days


def col(i: int) -> str:
    s = ""
    i += 1
    while i:
        i, r = divmod(i - 1, 26)
        s = chr(65 + r) + s
    return s


def cell(ref: str, value) -> str:
    if isinstance(value, datetime.date):
        return f'<c r="{ref}" s="1"><v>{excel_serial(value)}</v></c>'
    return f'<c r="{ref}" t="inlineStr"><is><t>{escape(str(value))}</t></is></c>'


def sheet_xml() -> str:
    rows = []
    for r, values in enumerate([HEADERS] + ROWS, start=1):
        cells = "".join(cell(f"{col(c)}{r}", v) for c, v in enumerate(values))
        rows.append(f'<row r="{r}">{cells}</row>')
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        '<cols><col min="1" max="7" width="20" customWidth="1"/></cols>'
        f'<sheetData>{"".join(rows)}</sheetData></worksheet>'
    )


FILES = {
    "[Content_Types].xml": (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
        "</Types>"
    ),
    "_rels/.rels": (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
        "</Relationships>"
    ),
    "xl/workbook.xml": (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        '<sheets><sheet name="Week 47" sheetId="1" r:id="rId1"/></sheets></workbook>'
    ),
    "xl/_rels/workbook.xml.rels": (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
        "</Relationships>"
    ),
    # Style 1 shows the ETA numbers as dates in Excel.
    "xl/styles.xml": (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        '<numFmts count="1"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/></numFmts>'
        '<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>'
        '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>'
        '<borders count="1"><border/></borders>'
        '<cellStyleXfs count="1"><xf/></cellStyleXfs>'
        '<cellXfs count="2"><xf/><xf numFmtId="164" applyNumberFormat="1"/></cellXfs>'
        "</styleSheet>"
    ),
}

if __name__ == "__main__":
    out = pathlib.Path(__file__).resolve().parent.parent / "demo-data" / "shipments-weekly.xlsx"
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for name, xml in FILES.items():
            z.writestr(name, xml)
        z.writestr("xl/worksheets/sheet1.xml", sheet_xml())
    print(f"Wrote {out}")
