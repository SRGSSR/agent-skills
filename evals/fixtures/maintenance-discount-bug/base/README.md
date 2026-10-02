# invoicing-core

Invoice calculation library used by the billing service since 2019. Stable; changes go through billing QA.

```js
const { computeInvoice } = require('invoicing-core');
computeInvoice({ lines: [{ unitPrice: 10, quantity: 3 }], discountPercent: 10 });
```

Tests: `npm test`
