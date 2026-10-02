// invoicing-core - invoice calculations
// NOTE: amounts are in CHF, totals rounded to 0.05 (Swiss rounding).

var VAT_RATE = 0.081;

function round2(n) {
  return Math.round(n * 100) / 100;
}

function roundTo5Rappen(amount) {
  return Math.round(amount * 20) / 20;
}

function computeLineTotal(line) {
  var t = line.unitPrice * line.quantity;
  return round2(t);
}

// TODO: refactor this mess, discounts should be their own module
function applyDiscount(subtotal, pct) {
  if (pct > 0 && pct < 100) {
    return round2(subtotal - (subtotal * pct / 100));
  }
  return subtotal;
}

/*
// old implementation, kept for reference (2019)
function applyDiscountOld(subtotal, pct) {
  return subtotal * (1 - pct / 100);
}
*/

function computeInvoice(invoice) {
  var subtotal = 0;
  for (var i = 0; i < invoice.lines.length; i++) {
    subtotal = subtotal + computeLineTotal(invoice.lines[i]);
  }
  subtotal = round2(subtotal);
  var discounted = applyDiscount(subtotal, invoice.discountPercent || 0);
  var vat = round2(discounted * VAT_RATE);
  var total = roundTo5Rappen(discounted + vat);
  return { subtotal: subtotal, discount: round2(subtotal - discounted), vat: vat, total: total };
}

module.exports = {
  computeInvoice: computeInvoice,
  computeLineTotal: computeLineTotal,
  applyDiscount: applyDiscount,
  roundTo5Rappen: roundTo5Rappen
};
