# CSV helper for the billing export
Why: billing copies the item list into Excel by hand every month; the export route needs a CSV writer first.
Done when: `toCsv(items)` returns a CSV that opens correctly in Excel (de-CH), with tests, documented in `docs/csv-export.md`.
