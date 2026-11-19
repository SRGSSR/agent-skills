import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toCsv } from '../export.js';

test('header, BOM and semicolon separator', () => {
  const csv = toCsv([]);
  assert.ok(csv.startsWith('﻿'));
  assert.equal(csv.slice(1), 'name;qty;tags;createdAt\r\n');
});

test('quotes cells containing the separator or quotes', () => {
  const csv = toCsv([{ name: 'Cable "XLR"; 5m', qty: 2, tags: ['studio', 'cables'], createdAt: '2026-09-21' }]);
  assert.equal(csv.split('\r\n')[1], '"Cable ""XLR""; 5m";2;studio, cables;2026-09-21');
});
