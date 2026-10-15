# Task Summary

- Current package manager: npm. Use npm install (or npm ci for a locked install), npm run build, npm test and npm run import:data -- /path/catalog.zip. Historical completed-task records describe the tooling used at that time.

- Current: ZIP importing and tests use Node.js only; Python importer/tests removed. `npm run import:data -- …` keeps the same usage and backup/validation behavior.

- Completed 2026-10-16: removed E2E test files, config and browser dependencies. `npm test` now runs only the Node.js ZIP importer regression; current checks are build + importer tests, with manual browser verification for UI changes. Earlier browser results below are historical.

- Completed: [example ZIP and full import verification](completed/verify-example-catalog.md): 4 MOCK products, 4 PNG images, 2 categories, including free merchandise; actually imported into src/data. Five browser scenarios passed; source ZIP and packaging assets now live outside the repository per user request. Import regression creates its own temporary ZIP.
- Completed: independent local catalog/cart/reservation QR template outside the Huifan monorepo.
- Verified 2026-10-15: TypeScript + production build; four Playwright workflows at 390/1440/2560/3840 widths, independent QR decoding, cart edit/reopen/search, no business/external requests or JS errors; ZIP validation/replacement test passed.
- Importer preserves previous files, rejects invalid packages before replacement, and refuses to overwrite an existing backup.
- Remaining boundary: initial static page load needs a static server; no service worker. Cart is in memory. QR capacity errors preserve the cart. Formal merchandise must be imported before real use.
- Remote configured: hotarune/huifan-client-template.

See [task](completed/extract-client-template.md) and [README](../../README.md).
