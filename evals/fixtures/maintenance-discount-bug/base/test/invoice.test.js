const test = require('node:test');
const assert = require('node:assert');
const { computeInvoice } = require('../src/invoice');
const { formatCHF } = require('../src/format');

test('computes subtotal, VAT and total', () => {
  const r = computeInvoice({ lines: [{ unitPrice: 10, quantity: 3 }, { unitPrice: 5.5, quantity: 2 }] });
  assert.strictEqual(r.subtotal, 41);
  assert.strictEqual(r.vat, 3.32);
  assert.strictEqual(r.total, 44.3);
});

test('applies a percentage discount', () => {
  const r = computeInvoice({ lines: [{ unitPrice: 100, quantity: 1 }], discountPercent: 10 });
  assert.strictEqual(r.discount, 10);
  assert.strictEqual(r.total, 97.3);
});

test('formats CHF with apostrophe thousands separator', () => {
  assert.strictEqual(formatCHF(1234567.5), "CHF 1'234'567.50");
  assert.strictEqual(formatCHF(-1234.5), "CHF -1'234.50");
});
