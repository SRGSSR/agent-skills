import test from 'node:test';
import assert from 'node:assert';
import { formatDuration } from '../src/duration.js';

test('formats seconds as HH:MM:SS', () => {
  assert.strictEqual(formatDuration(3725), '01:02:05');
  assert.strictEqual(formatDuration(59), '00:00:59');
});

test('does not wrap after 24 hours', () => {
  assert.strictEqual(formatDuration(25 * 3600 + 61), '25:01:01');
});
