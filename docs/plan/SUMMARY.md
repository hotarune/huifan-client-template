# Task Summary

- Completed: [example ZIP and full import verification](completed/verify-example-catalog.md): 4 MOCK products, 4 PNG images, 2 categories, including free merchandise; actually imported into src/data. Five browser scenarios and two importer regressions passed.
- Completed: independent local catalog/cart/reservation QR template outside the Huifan monorepo.
- Verified 2026-10-15: TypeScript + production build; four Playwright workflows at 390/1440/2560/3840 widths, independent QR decoding, cart edit/reopen/search, no business/external requests or JS errors; ZIP validation/replacement test passed.
- Importer preserves previous files, rejects invalid packages before replacement, and refuses to overwrite an existing backup.
- Remaining boundary: initial static page load needs a static server; no service worker. Cart is in memory. QR capacity errors preserve the cart. Formal merchandise must be imported before real use.
- No remote is configured for the standalone repository; push requires a destination.

See [task](completed/extract-client-template.md) and [README](../../README.md).
