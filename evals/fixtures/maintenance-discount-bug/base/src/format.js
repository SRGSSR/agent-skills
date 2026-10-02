var invoice = require('./invoice');

function formatCHF(amount) {
  var s = amount.toFixed(2);
  var parts = s.split('.');
  var intPart = parts[0];
  var out = '';
  var count = 0;
  for (var i = intPart.length - 1; i >= 0; i--) {
    out = intPart[i] + out;
    count++;
    if (count % 3 === 0 && i > 0 && intPart[i - 1] !== '-') out = "'" + out;
  }
  return 'CHF ' + out + '.' + parts[1];
}

function formatInvoiceSummary(inv) {
  var r = invoice.computeInvoice(inv);
  return [
    'Subtotal: ' + formatCHF(r.subtotal),
    'Discount: ' + formatCHF(r.discount),
    'VAT 8.1%: ' + formatCHF(r.vat),
    'Total: ' + formatCHF(r.total)
  ].join('\n');
}

module.exports = { formatCHF: formatCHF, formatInvoiceSummary: formatInvoiceSummary };
