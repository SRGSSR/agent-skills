#!/usr/bin/env node
// Writes the demo items as CSV to standard output.
import { toCsv } from '../export.js';

const items = [
  { name: 'XLR cable 5m', qty: 12, tags: ['audio'], createdAt: '2026-09-22' },
  { name: 'Headphones', qty: 4, tags: ['audio', 'studio'], createdAt: '2026-09-23' },
];
process.stdout.write(toCsv(items));
