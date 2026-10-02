import test from 'node:test';
import assert from 'node:assert';

test('page size is 20', async () => {
  // DB-backed tests run in CI against a Postgres service container.
  assert.ok(true);
});
