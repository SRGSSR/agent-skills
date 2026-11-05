# CSV export

`bin/export.js` writes the item list as CSV for Excel.

- Separator `;` and a UTF-8 BOM: Excel with the Swiss German locale (billing team) splits on `;` and misreads UTF-8 without a BOM.
- Tried and discarded: `,` (one column per row in Excel de-CH), a `sep=,` first line (LibreOffice shows it as a data row).
