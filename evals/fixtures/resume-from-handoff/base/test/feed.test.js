import test from 'node:test';
import assert from 'node:assert';
import { renderFeed } from '../src/feed.js';

const show = { title: 'Tech & Talk', url: 'https://example.com/tech', description: 'Weekly tech' };
const episodes = [
  { id: 'e1', title: 'Old one', publishedAt: '2026-01-01T10:00:00Z', audioUrl: 'https://cdn.example.com/e1.mp3', sizeBytes: 1000 },
  { id: 'e2', title: 'Pinned <intro>', publishedAt: '2025-01-01T10:00:00Z', audioUrl: 'https://cdn.example.com/e2.mp3', sizeBytes: 2000, pinned: true },
];

test('pinned episodes come first', () => {
  const xml = renderFeed(show, episodes);
  assert.ok(xml.indexOf('e2') < xml.indexOf('e1'));
});

test('escapes XML in titles', () => {
  const xml = renderFeed(show, episodes);
  assert.ok(xml.includes('Tech &amp; Talk'));
  assert.ok(xml.includes('Pinned &lt;intro&gt;'));
});
