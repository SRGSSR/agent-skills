export function toCsv(items) {
  const cell = (v) => {
    const s = String(v);
    return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = [
    ['name', 'qty', 'tags', 'createdAt'],
    ...items.map((i) => [i.name, i.qty, i.tags.join(', '), i.createdAt]),
  ];
  return '﻿' + rows.map((r) => r.map(cell).join(';')).join('\r\n') + '\r\n';
}
