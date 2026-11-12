#!/usr/bin/env node
// Programmatic grading for the evals in evals.json.
//
// Usage: node evals/grade.mjs <eval-name> <run-dir>
// <run-dir> must contain repo/ (the worked-on fixture), base_commit.txt and outputs/.
// Judgment checks can be added in <run-dir>/manual.json as [{ text, passed, evidence }].
// Writes <run-dir>/grading.json in the skill-creator format.
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [evalName, runDirArg] = process.argv.slice(2);
if (!evalName || !runDirArg) {
  console.error('usage: node evals/grade.mjs <eval-name> <run-dir>');
  process.exit(2);
}
const runDir = path.resolve(runDirArg);
const repo = fs.existsSync(path.join(runDir, 'repo')) ? path.join(runDir, 'repo') : path.join(runDir, 'outputs', 'repo');
const base = fs.readFileSync(path.join(runDir, 'base_commit.txt'), 'utf8').trim();

const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' });
const exists = (f) => fs.existsSync(path.join(repo, f));
const read = (f) => (exists(f) ? fs.readFileSync(path.join(repo, f), 'utf8') : '');
const atBase = (f) => {
  try {
    return execFileSync('git', ['-C', repo, 'show', `${base}:${f}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
};
const changedFiles = () => {
  const tracked = git('diff', base, '--name-only').split('\n').filter(Boolean);
  const untracked = git('ls-files', '--others', '--exclude-standard').split('\n').filter(Boolean);
  return [...new Set([...tracked, ...untracked])].sort();
};
const isState = (f) => f === 'AGENTS.md' || f === '.gitattributes' || f.startsWith('.ai/');
// Text between <!-- name:start --> and <!-- name:end --> inclusive, or ''.
const block = (text, name) => {
  const m = new RegExp(`<!-- ${name}:start -->[\\s\\S]*?<!-- ${name}:end -->`).exec(text);
  return m ? m[0] : '';
};
const addedRemoved = (f) => {
  if (!atBase(f)) return { added: read(f).split('\n').filter(Boolean).length, removed: 0 };
  const line = git('diff', base, '--numstat', '--', f).trim();
  if (!line) return { added: 0, removed: 0 };
  const [a, r] = line.split('\t');
  return { added: Number(a), removed: Number(r) };
};
const runNode = (args, input) =>
  spawnSync('node', args, { cwd: repo, encoding: 'utf8', input, timeout: 60000 });
const testsPass = () => {
  const r = runNode(['--test']);
  const summary = (r.stdout + r.stderr).split('\n').filter((l) => /^ℹ (tests|pass|fail)/.test(l)).join(', ');
  return { ok: r.status === 0, summary: summary || (r.stderr || '').slice(0, 300) };
};
const deps = (json) => {
  try {
    const p = JSON.parse(json);
    return JSON.stringify({ d: p.dependencies || {}, dd: p.devDependencies || {} });
  } catch {
    return 'invalid';
  }
};

// Headers (`## ...`) of journal entries added since base.
const newJournalHeads = () => {
  const added = git('diff', base, '--', '.ai/journal').split('\n').filter((l) => /^\+## /.test(l)).map((l) => l.slice(1));
  const untracked = git('ls-files', '--others', '--exclude-standard', '--', '.ai/journal').split('\n').filter(Boolean);
  return [...added, ...untracked.flatMap((f) => read(f).split('\n').filter((l) => l.startsWith('## ')))];
};

// Sentences of the final message that ask the user about the phase.
const phaseQuestions = () => {
  const msg = fs.existsSync(path.join(runDir, 'outputs', 'final_message.md')) ? fs.readFileSync(path.join(runDir, 'outputs', 'final_message.md'), 'utf8') : '';
  return msg.split(/(?<=[?.!])\s+|\n/).filter((x) => x.includes('?') && /phase|stabili[sz]e|production|prototype|maintenance|explore/i.test(x));
};
const finalMessage = () => {
  const f = path.join(runDir, 'outputs', 'final_message.md');
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '';
};

const HANDOFF_UPDATED = 'The handoff reflects the new state (rewritten, moved to .ai/handoff/<branch>.md, or deleted because the task is done)';

const UPGRADED = 'The 0.2 layout was upgraded: no .ai/handoff.md left and the work-journal block uses .ai/handoff/<branch>.md';
const results = [];
const check = (text, fn) => {
  try {
    const [passed, evidence] = fn();
    results.push({ text, passed: Boolean(passed), evidence: String(evidence) });
  } catch (err) {
    results.push({ text, passed: false, evidence: `check failed: ${err.message}` });
  }
};

// Calls the request handler of a plain node:http server without opening a port.
function callHttpHandler(serverFile, urls) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'grade-'));
  const preload = path.join(tmp, 'preload.cjs');
  fs.writeFileSync(
    preload,
    `const http = require('node:http');
http.createServer = (a, b) => {
  globalThis.__handler = typeof a === 'function' ? a : b;
  const fake = { listen() { return fake; }, on() { return fake; }, close() {}, address() { return { port: 0 }; } };
  return fake;
};`,
  );
  const runner = path.join(tmp, 'runner.mjs');
  fs.writeFileSync(
    runner,
    `import { EventEmitter } from 'node:events';
import { pathToFileURL } from 'node:url';
await import(pathToFileURL(${JSON.stringify(serverFile)}).href);
const call = (url) => new Promise((resolve) => {
  const req = new EventEmitter();
  Object.assign(req, { method: 'GET', url, headers: { host: 'localhost' } });
  const res = {
    statusCode: 200, headers: {}, chunks: [],
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    getHeader(k) { return this.headers[k.toLowerCase()]; },
    writeHead(s, a, b) { this.statusCode = s; const h = a && typeof a === 'object' ? a : b; if (h) for (const k in h) this.headers[k.toLowerCase()] = h[k]; return this; },
    write(c) { this.chunks.push(String(c)); return true; },
    end(c) { if (c) this.chunks.push(String(c)); resolve({ status: this.statusCode, headers: this.headers, body: this.chunks.join('') }); },
    on() { return this; }, once() { return this; }, emit() {},
  };
  globalThis.__handler(req, res);
  setImmediate(() => req.emit('end'));
  setTimeout(() => resolve({ status: 0, headers: {}, body: 'timeout' }), 3000);
});
const out = {};
for (const u of ${JSON.stringify(urls)}) out[u] = await call(u);
if (out['/']) {
  const m = /href=["']([^"']*csv[^"']*)["']/i.exec(out['/'].body);
  out.link = m ? m[1] : null;
  out.downloadAttr = /<a[^>]*csv[^>]*download|<a[^>]*download[^>]*csv/i.test(out['/'].body);
  if (out.link) out.csv = await call(out.link.replace(/&amp;/g, '&'));
}
console.log(JSON.stringify(out));
process.exit(0);`,
  );
  const r = spawnSync('node', ['--require', preload, runner], { cwd: repo, encoding: 'utf8', timeout: 20000 });
  if (r.status !== 0) throw new Error((r.stderr || 'runner failed').slice(0, 300));
  return JSON.parse(r.stdout.trim().split('\n').pop());
}

const graders = {
  'prototype-csv-export'() {
    const changed = changedFiles();
    const project = changed.filter((f) => !isState(f));
    let http;
    check('The list page links to a CSV download that returns all 3 items', () => {
      http = callHttpHandler(path.join(repo, 'server.js'), ['/']);
      if (!http.link) return [false, 'no link containing "csv" found on the list page'];
      const body = http.csv?.body || '';
      const all = ['Microphone stand', 'XLR cable 5m', 'Headphones'].every((n) => body.includes(n));
      const disposition = http.csv?.headers?.['content-disposition'] || '';
      const downloads = /attachment/i.test(disposition) || http.downloadAttr;
      return [
        http.csv?.status === 200 && all && downloads,
        `link ${http.link}, status ${http.csv?.status}, all items: ${all}, attachment/download: ${downloads}`,
      ];
    });
    check("The item name containing a comma ('Headphones, closed-back') is correctly quoted in the CSV", () => {
      const body = http?.csv?.body || '';
      return [body.includes('"Headphones, closed-back"'), body.split('\n').find((l) => l.includes('Headphones')) || 'no row'];
    });
    check('Only server.js changed among project files (ignoring AGENTS.md and .ai/)', () => [
      project.length === 1 && project[0] === 'server.js',
      `changed: ${project.join(', ') || 'none'}`,
    ]);
    check('No dependencies were added to package.json', () => [
      deps(read('package.json')) === deps(atBase('package.json')),
      `before ${deps(atBase('package.json'))}, after ${deps(read('package.json'))}`,
    ]);
    check('No test files, CI, Docker or lint config were created', () => {
      const bad = changed.filter((f) => /test|spec|\.github|docker|eslint|prettier|editorconfig|biome/i.test(f));
      return [bad.length === 0, bad.length ? `created: ${bad.join(', ')}` : 'none'];
    });
  },

  'maintenance-discount-bug'() {
    const changed = changedFiles();
    check('An invoice with a 100% discount now has total 0', () => {
      const r = runNode([
        '-e',
        "const {computeInvoice}=require('./src/invoice');console.log(JSON.stringify(computeInvoice({lines:[{unitPrice:100,quantity:1}],discountPercent:100})))",
      ]);
      const out = JSON.parse(r.stdout);
      return [out.total === 0, r.stdout.trim()];
    });
    check('The existing test suite passes', () => {
      const t = testsPass();
      return [t.ok, t.summary];
    });
    check('A regression test for the 100% discount was added', () => {
      const tests = changed.filter((f) => /test/i.test(f));
      const diff = tests.map((f) => (atBase(f) ? git('diff', base, '--', f) : read(f))).join('\n');
      const added = diff.split('\n').filter((l) => !l.startsWith('-')).join('\n');
      return [/100/.test(added) && /discount/i.test(added), tests.length ? `test files changed: ${tests.join(', ')}` : 'no test file changed'];
    });
    check('src/format.js is unchanged', () => [!changed.includes('src/format.js'), `changed: ${changed.join(', ')}`]);
    check('The change in src/invoice.js is small (at most 6 added+removed lines)', () => {
      const { added, removed } = addedRemoved('src/invoice.js');
      return [added + removed <= 6 && added + removed > 0, `+${added} -${removed}`];
    });
    check(
      'No cleanup in src/invoice.js: var declarations, round2, the TODO comment and the commented-out old implementation are all still there',
      () => {
        const now = read('src/invoice.js');
        const before = atBase('src/invoice.js');
        const vars = (s) => (s.match(/\bvar\b/g) || []).length;
        const kept = {
          vars: vars(now) >= vars(before),
          round2: now.includes('function round2'),
          todo: now.includes('TODO: refactor this mess'),
          oldImpl: now.includes('applyDiscountOld'),
        };
        return [Object.values(kept).every(Boolean), JSON.stringify(kept)];
      },
    );
    check('package.json is unchanged', () => [!changed.includes('package.json'), `changed: ${changed.join(', ')}`]);
  },

  'setup-production-repo'() {
    const changed = changedFiles();
    const instr = ['AGENTS.md', 'CLAUDE.md'].filter((f) => changed.includes(f));
    const stateText = changed.filter((f) => f.endsWith('.md')).map(read).join('\n');
    check('Phase instructions were written to a file agents load automatically (AGENTS.md or CLAUDE.md)', () => [
      instr.length > 0 && instr.some((f) => /phase|stage/i.test(read(f)) || /@AGENTS\.md/.test(read(f))),
      `changed instruction files: ${instr.join(', ') || 'none'}`,
    ]);
    check('The chosen current phase is production', () => {
      const text = instr.map(read).join('\n') + '\n' + read('.ai/phase.md');
      const m = /(phase|stage)\b[^\n]{0,30}\bproduction\b|\bproduction\b[^\n]{0,15}\b(phase|stage)\b/i.exec(text);
      return [Boolean(m), m ? m[0] : 'no "production phase" statement found'];
    });
    check('Claude Code will see the instructions: CLAUDE.md contains them or imports @AGENTS.md', () => {
      const claude = read('CLAUDE.md');
      const ok = /@AGENTS\.md/.test(claude) || (changed.includes('CLAUDE.md') && /production/i.test(claude));
      return [ok, ok ? 'CLAUDE.md imports or contains the phase' : 'CLAUDE.md neither imports AGENTS.md nor contains the phase'];
    });
    check('The original CLAUDE.md content is preserved', () => {
      const now = read('CLAUDE.md') + '\n' + read('AGENTS.md');
      const missing = atBase('CLAUDE.md').split('\n').filter((l) => l.trim() && !l.startsWith('#') && !now.includes(l.replace(/^- /, '')));
      const moved = !atBase('CLAUDE.md').split('\n').every((l) => !l.trim() || read('CLAUDE.md').includes(l));
      return [missing.length === 0, missing.length ? `missing: ${missing.join(' | ')}` : moved ? 'all original rules present (moved to AGENTS.md)' : 'all original lines present in CLAUDE.md'];
    });
    check('legacy/old-importer gets its own phase (maintenance or sunset) as an area override', () => {
      const lines = stateText.split('\n');
      const hit = lines.findIndex(
        (l, i) => /legacy|old-importer/i.test(l) && /maintenance|sunset|fix[- ]only|only fix/i.test(lines.slice(Math.max(0, i - 1), i + 3).join(' ')),
      );
      return [hit >= 0, hit >= 0 ? lines[hit].trim() : 'no override for legacy/old-importer found'];
    });
    check('No source, test, config or legacy files were modified', () => {
      const bad = changed.filter((f) => (!f.endsWith('.md') && !isState(f)) || f.startsWith('legacy/'));
      return [bad.length === 0, `changed: ${changed.join(', ')}`];
    });
    check('The always-loaded instructions are concise (at most 40 lines added across AGENTS.md and CLAUDE.md)', () => {
      const total = instr.reduce((n, f) => n + addedRemoved(f).added, 0);
      return [total > 0 && total <= 40, `${total} lines added (${instr.map((f) => `${f}: +${addedRemoved(f).added}`).join(', ')})`];
    });
    check(
      'At least one project-specific rule grounded in the repo (e.g. existing migrations are never edited, or API responses stay compatible with old app versions) is in the always-loaded instructions',
      () => {
        const text = instr.map(read).join('\n');
        const rules = text.split('\n').filter(
          (l) =>
            (/migration/i.test(l) && /never|don't|do not|immutable|already ran|new (numbered )?file/i.test(l)) ||
            (/(mobile|app versions|consumers|web and mobile)/i.test(l) && /compatib|additive|only grow|never (remove|rename)/i.test(l)),
        );
        return [rules.length > 0, rules.length ? rules[0].trim() : 'no project-specific rule found'];
      },
    );
  },

  'maintenance-small-feature'() {
    const changed = changedFiles();
    const invoiceDiff = git('diff', base, '--', 'src/invoice.js');
    const added = invoiceDiff.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++'));
    check('A fixed-amount discount works (CHF 100 invoice with CHF 20 off gives discount 20 and total 86.5)', () => {
      const r = runNode([
        '-e',
        `const { computeInvoice } = require('./src/invoice');
const lines = [{ unitPrice: 100, quantity: 1 }];
const tries = [];
for (const k of ['discountAmount','fixedDiscount','discountFixed','fixedDiscountAmount','fixedAmountDiscount','discountChf','discountCHF','discountValue','amountDiscount','flatDiscount','discountFlat']) tries.push([k, { lines, [k]: 20 }]);
for (const v of [{ type: 'fixed', value: 20 }, { type: 'amount', value: 20 }, { type: 'fixed', amount: 20 }, { amount: 20 }, { fixed: 20 }]) tries.push(['discount=' + JSON.stringify(v), { lines, discount: v }]);
for (const [k, inv] of tries) { try { const r = computeInvoice(inv); if (r.discount === 20) { console.log(JSON.stringify({ k, r })); process.exit(0); } } catch (e) {} }
console.log('null');`,
      ]);
      const out = JSON.parse(r.stdout.trim() || 'null');
      if (!out) return [false, 'no known input shape gives discount 20; check the diff (can be overridden in manual.json)'];
      return [out.r.total === 86.5, `${out.k}: ${JSON.stringify(out.r)}`];
    });
    check('Percentage discounts behave exactly as before and the existing test suite passes', () => {
      const t = testsPass();
      const r = runNode([
        '-e',
        "const {computeInvoice}=require('./src/invoice');console.log(JSON.stringify([10,50,99.5,0].map(p=>computeInvoice({lines:[{unitPrice:123.45,quantity:3}],discountPercent:p}))))",
      ]);
      const expected = JSON.stringify(
        [10, 50, 99.5, 0].map((p) => {
          const round2 = (n) => Math.round(n * 100) / 100;
          const subtotal = round2(round2(123.45 * 3));
          const discounted = p > 0 && p < 100 ? round2(subtotal - (subtotal * p) / 100) : subtotal;
          const vat = round2(discounted * 0.081);
          return { subtotal, discount: round2(subtotal - discounted), vat, total: Math.round((discounted + vat) * 20) / 20 };
        }),
      );
      const same = r.stdout.trim() === expected;
      return [t.ok && same, `${t.summary}; percentage results unchanged: ${same}`];
    });
    check('Tests for the fixed-amount discount were added', () => {
      const tests = changed.filter((f) => /test/i.test(f));
      const diff = tests.map((f) => (atBase(f) ? git('diff', base, '--', f) : read(f))).join('\n');
      const addedTests = diff.split('\n').filter((l) => !l.startsWith('-')).join('\n');
      return [/fixed|amount/i.test(addedTests), tests.length ? `test files changed: ${tests.join(', ')}` : 'no test file changed'];
    });
    check('No new source files were created (no separate discounts module)', () => {
      const created = changed.filter((f) => f.startsWith('src/') && !atBase(f));
      return [created.length === 0, created.length ? `created: ${created.join(', ')}` : 'none'];
    });
    check('The TODO comment, the commented-out old implementation and round2 are still in src/invoice.js', () => {
      const now = read('src/invoice.js');
      const kept = {
        todo: now.includes('TODO: refactor this mess'),
        oldImpl: now.includes('applyDiscountOld'),
        round2: now.includes('function round2'),
      };
      return [Object.values(kept).every(Boolean), JSON.stringify(kept)];
    });
    check('New code in src/invoice.js matches the existing style (no const, let or arrow functions added)', () => {
      const modern = added.filter((l) => /\b(const|let)\b|=>/.test(l));
      return [modern.length === 0, modern.length ? modern.slice(0, 3).join(' | ') : `${added.length} added lines, all var/function style`];
    });
    check('All existing exports of src/invoice.js are still exported', () => {
      const r = runNode(['-e', "console.log(Object.keys(require('./src/invoice')).join(','))"]);
      const keys = r.stdout.trim().split(',');
      const missing = ['computeInvoice', 'computeLineTotal', 'applyDiscount', 'roundTo5Rappen'].filter((k) => !keys.includes(k));
      return [missing.length === 0, missing.length ? `missing: ${missing.join(', ')}` : `exports: ${keys.join(', ')}`];
    });
    check('src/format.js and package.json are unchanged', () => {
      const touched = changed.filter((f) => f === 'src/format.js' || f === 'package.json');
      return [touched.length === 0, `changed: ${changed.join(', ')}`];
    });
  },

  'resume-from-handoff'() {
    const changed = changedFiles();
    const render = (episode) => {
      const r = runNode([
        '--input-type=module',
        '-e',
        `import { renderItem } from './src/feed.js'; console.log(JSON.stringify(renderItem(${JSON.stringify(episode)})));`,
      ]);
      if (r.status !== 0) throw new Error(r.stderr.slice(0, 200));
      return JSON.parse(r.stdout);
    };
    const ep = { id: 'x', title: 't', publishedAt: '2026-01-01T00:00:00Z', audioUrl: 'https://a/x.mp3', sizeBytes: 1 };
    check('Feed items with a duration contain <itunes:duration> in HH:MM:SS', () => {
      const a = render({ ...ep, durationSeconds: 3725 });
      const b = render({ ...ep, duration: 3725 });
      const ok = [a, b].some((x) => x.includes('<itunes:duration>01:02:05</itunes:duration>'));
      return [ok, ok ? 'tag present for 3725s' : `no tag: ${a.slice(0, 200)}`];
    });
    check('Items without a duration, or with 0, have no <itunes:duration> tag', () => {
      const outs = [render(ep), render({ ...ep, durationSeconds: 0 }), render({ ...ep, duration: 0 })];
      const bad = outs.filter((x) => x.includes('<itunes:duration'));
      return [bad.length === 0, bad.length ? `tag emitted: ${bad[0].match(/<itunes:duration>[^<]*/)?.[0]}` : 'no tag in all three cases'];
    });
    check('The test suite passes', () => {
      const t = testsPass();
      return [t.ok, t.summary];
    });
    check('test/feed.test.js has new tests about the duration', () => {
      const diff = git('diff', base, '--', 'test/feed.test.js');
      return [/^\+.*duration/im.test(diff), diff ? 'feed tests changed' : 'test/feed.test.js unchanged'];
    });
    check("No dependency was added (in particular not the 'podcast' package)", () => [
      deps(read('package.json')) === deps(atBase('package.json')),
      `after: ${deps(read('package.json'))}`,
    ]);
    check('formatDuration was not reimplemented with Date/toISOString', () => {
      const src = changed.filter((f) => f.startsWith('src/')).map(read).join('\n');
      return [!/toISOString\(\)\.(substr|slice|substring)\(11/.test(src), 'checked changed src files'];
    });
    check('CHANGELOG.md has an entry under Unreleased', () => {
      const m = /## Unreleased\n([\s\S]*?)\n## /.exec(read('CHANGELOG.md'));
      const entry = m && m[1].split('\n').find((l) => l.trim().startsWith('-'));
      return [Boolean(entry), entry || 'no entry'];
    });
    check('A journal entry for today records the resumed work', () => {
      const files = changed.filter((f) => f.startsWith('.ai/journal/'));
      const text = files.map(read).join('\n');
      return [files.length > 0 && /resum|fortgesetzt|wieder aufgenommen|repris/i.test(text), files.length ? files.join(', ') : 'no journal file written'];
    });
    check(HANDOFF_UPDATED, () => {
      const h = changed.filter((f) => f === '.ai/handoff.md' || f.startsWith('.ai/handoff/'));
      return [h.length > 0, h.length ? h.map((f) => `${f}: ${exists(f) ? read(f).split('\n').slice(0, 3).join(' / ') : 'deleted'}`).join(' | ') : 'no handoff changed'];
    });
    if (evalName.startsWith('resume-from-handoff')) {
      check(UPGRADED, () => {
        const b = block(read('AGENTS.md'), 'work-journal');
        return [!exists('.ai/handoff.md') && b.includes('.ai/handoff/<branch>.md'), `handoff.md: ${exists('.ai/handoff.md') ? 'present' : 'absent'}, block: ${b ? (b.includes('.ai/handoff/<branch>.md') ? '0.3' : 'old') : 'none'}`];
      });
    }
  },

  'journal-off-csv'() {
    graders['prototype-csv-export']();
    const changed = changedFiles();
    const agents = read('AGENTS.md');
    check('AGENTS.md still has the work-journal off marker and no work-journal block', () => [
      agents.includes('<!-- work-journal:off -->') && !agents.includes('<!-- work-journal:start -->'),
      `off marker: ${agents.includes('<!-- work-journal:off -->')}, block: ${agents.includes('<!-- work-journal:start -->')}`,
    ]);
    check('The project-phase block in AGENTS.md is unchanged', () => {
      const same = block(agents, 'project-phase') === block(atBase('AGENTS.md'), 'project-phase');
      return [same, same ? 'unchanged' : 'block differs from base'];
    });
    check('.ai/handoff.md is unchanged and no journal entry was written', () => {
      const touched = changed.filter((f) => f === '.ai/handoff.md' || f.startsWith('.ai/handoff/') || f.startsWith('.ai/journal/'));
      return [touched.length === 0, touched.length ? `changed: ${touched.join(', ')}` : 'none'];
    });
  },

  'phase-on'() {
    const changed = changedFiles();
    const agents = read('AGENTS.md');
    const b = block(agents, 'project-phase');
    check('AGENTS.md has a project-phase block and no off marker', () => [
      Boolean(b) && !agents.includes('<!-- project-phase:off -->'),
      `block: ${Boolean(b)}, off marker: ${agents.includes('<!-- project-phase:off -->')}`,
    ]);
    check('The block is the maintenance contract since 2025-03-01', () => {
      const m = /phase:\s*MAINTENANCE\s*\(since 2025-03-01\)/i.exec(b);
      return [Boolean(m), m ? m[0] : b.split('\n')[1] || 'no block'];
    });
    check('The custom rule from .ai/phase.md (billing QA, rounding) is in the block', () => {
      const l = b.split('\n').find((x) => /billing QA/i.test(x) && /round/i.test(x));
      return [Boolean(l), l || 'not found'];
    });
    check('The other AGENTS.md content (Agent notes, Commands) is preserved', () => {
      const kept = ['# Agent notes', '## Commands', 'Run `npm test` before reporting a change as done.'].every((s) => agents.includes(s));
      return [kept, kept ? 'kept' : 'missing original content'];
    });
    check('The block is concise (at most 20 lines)', () => {
      const n = b.split('\n').length;
      return [n > 0 && n <= 20, `${n} lines`];
    });
    check('No files changed outside AGENTS.md, CLAUDE.md and .ai/', () => {
      const bad = changed.filter((f) => !isState(f) && f !== 'CLAUDE.md');
      return [bad.length === 0, `changed: ${changed.join(', ')}`];
    });
  },

  'phase-off-it'() {
    const changed = changedFiles();
    const agents = read('AGENTS.md');
    check('AGENTS.md has the project-phase off marker and no project-phase block', () => [
      agents.includes('<!-- project-phase:off -->') && !block(agents, 'project-phase'),
      `off marker: ${agents.includes('<!-- project-phase:off -->')}, block: ${Boolean(block(agents, 'project-phase'))}`,
    ]);
    check('The work-journal block in AGENTS.md is unchanged', () => {
      const same = block(agents, 'work-journal') === block(atBase('AGENTS.md'), 'work-journal') && Boolean(block(agents, 'work-journal'));
      return [same, same ? 'unchanged' : 'missing or changed'];
    });
    check('The hand-added rule about the demo items is preserved in .ai/phase.md', () => {
      const l = read('.ai/phase.md').split('\n').find((x) => /demo items/i.test(x) && /Friday/i.test(x));
      return [Boolean(l), l || 'not in .ai/phase.md'];
    });
    check('.ai/phase.md still records the prototype phase', () => {
      const l = read('.ai/phase.md').split('\n').find((x) => /^Current:/.test(x));
      return [/prototype/i.test(l || ''), l || 'no Current line'];
    });
    check('No files changed outside AGENTS.md, CLAUDE.md and .ai/', () => {
      const bad = changed.filter((f) => !isState(f) && f !== 'CLAUDE.md');
      return [bad.length === 0, `changed: ${changed.join(', ')}`];
    });
  },

  'parallel-handoff'() {
    graders['resume-from-handoff']();
    const changed = changedFiles();
    const own = '.ai/handoff/feature-itunes-duration.md';
    check("The other branch's handoff (.ai/handoff/feature-chapters.md) is unchanged", () => {
      const ok = !changed.includes('.ai/handoff/feature-chapters.md');
      return [ok, ok ? 'unchanged' : 'changed or deleted'];
    });
    check('No single .ai/handoff.md was created', () => [!exists('.ai/handoff.md'), exists('.ai/handoff.md') ? 'created' : 'absent']);
    check('New journal entries name the branch feature/itunes-duration in the header', () => {
      const heads = newJournalHeads();
      const ok = heads.length > 0 && heads.every((l) => l.includes('feature/itunes-duration'));
      return [ok, heads.join(' | ') || 'no new entries'];
    });
    check('If its handoff was deleted, the zero-duration decision was kept in a code comment or doc', () => {
      if (exists(own)) return [true, 'handoff kept'];
      const diff = git('diff', base, '--', 'src', 'docs', 'README.md', 'CHANGELOG.md');
      const l = diff.split('\n').find((x) => /^\+/.test(x) && /(\/\/|\*|#)/.test(x) && /(zero|\b0\b|00:00:00|unknown|apple)/i.test(x));
      return [Boolean(l), l || 'not found in added comments'];
    });
  },

  'merge-from-develop'() {
    graders['resume-from-handoff']();
    const changed = changedFiles();
    check('test/fixtures/episodes.json from develop is unchanged (reused, not recreated)', () => {
      const ok = !changed.includes('test/fixtures/episodes.json');
      return [ok, ok ? 'unchanged' : 'changed'];
    });
    check('The journal records the merge of develop into the branch', () => {
      const text = changed.filter((f) => f.startsWith('.ai/journal/')).map((f) => git('diff', base, '--', f) || read(f)).join('\n');
      const l = text.split('\n').find((x) => /merg/i.test(x) && /develop/i.test(x));
      return [Boolean(l), l || 'no line about the merge'];
    });
    check('No single .ai/handoff.md was created', () => [!exists('.ai/handoff.md'), exists('.ai/handoff.md') ? 'created' : 'absent']);
    check('The work-journal block was upgraded to 0.4 (project state not in private memory)', () => {
      const b = block(read('AGENTS.md'), 'work-journal');
      return [b.includes('private memory'), b ? (b.includes('private memory') ? '0.4' : 'old') : 'none'];
    });
  },

  'setup-docs'() {
    const changed = changedFiles();
    const instr = read('AGENTS.md') + '\n' + read('CLAUDE.md');
    const todos = changed.filter((f) => /^docs\/(backlog|tasks)\//.test(f) && exists(f));
    check('Work journal and handoff instructions were written to a file agents load automatically', () => {
      const ok = /journal/i.test(instr) && /handoff/i.test(instr);
      return [ok, ok ? 'found' : 'no journal/handoff instructions in AGENTS.md or CLAUDE.md'];
    });
    check('Claude Code will see them: CLAUDE.md contains them or imports @AGENTS.md', () => {
      const c = read('CLAUDE.md');
      return [/@AGENTS\.md/.test(c) || (/journal/i.test(c) && /handoff/i.test(c)), c.split('\n').slice(0, 3).join(' / ')];
    });
    check('The always-loaded instructions name docs/adr/ as the place for design decisions', () => {
      const l = instr.split('\n').find((x) => x.includes('docs/adr'));
      return [Boolean(l), l || 'docs/adr not mentioned'];
    });
    check('No new place for design decisions was created (docs/design/, docs/decisions*)', () => {
      const bad = changed.filter((f) => /^docs\/(design|decisions)/.test(f));
      return [bad.length === 0, bad.join(', ') || 'none'];
    });
    check('The existing ADRs are unchanged', () => {
      const bad = changed.filter((f) => f.startsWith('docs/adr/') && atBase(f));
      return [bad.length === 0, bad.join(', ') || 'unchanged'];
    });
    check('The open work in ROADMAP.md is not ignored: the instructions name it as the task list, or its items moved to docs/backlog/', () => {
      const l = instr.split('\n').find((x) => /ROADMAP\.md|docs\/(backlog|tasks)/.test(x));
      return [Boolean(l), l || 'neither ROADMAP.md nor docs/backlog in the instructions'];
    });
    check('If ROADMAP.md was split into docs/backlog/, every open item has a task file', () => {
      if (!todos.length) return [true, 'not split'];
      const text = todos.map(read).join('\n');
      const items = { 'full-text': /full.?text/i, 'rate limiting': /rate.?limit/i, 'old-importer': /importer/i, authors: /author/i };
      const missing = Object.keys(items).filter((k) => !items[k].test(text));
      return [missing.length === 0, missing.length ? `missing: ${missing.join(', ')}` : `${todos.length} task files`];
    });
    check('.gitattributes has merge=union for the journal', () => {
      const l = read('.gitattributes').split('\n').find((x) => x.includes('.ai/journal') && x.includes('merge=union'));
      return [Boolean(l), l || 'missing'];
    });
    check('No source, test, migration or legacy files were modified', () => {
      const bad = changed.filter((f) => /^(src|test|migrations|legacy|k8s|\.github)\//.test(f) || f === 'package.json');
      return [bad.length === 0, bad.join(', ') || 'none'];
    });
    check('The always-loaded instructions are concise (at most 25 lines added across AGENTS.md and CLAUDE.md)', () => {
      const n = addedRemoved('AGENTS.md').added + addedRemoved('CLAUDE.md').added;
      return [n <= 25, `${n} lines added`];
    });
  },

  'to-stabilize'() {
    const changed = changedFiles();
    const today = new Date().toISOString().slice(0, 10);
    const phase = read('.ai/phase.md');
    const debt = read('.ai/debt.md');
    const openBefore = (atBase('.ai/debt.md').match(/^- \[open\]/gm) || []).length;
    const newOpen = debt.split('\n').filter((l) => /^- \[open\]/.test(l) && !atBase('.ai/debt.md').includes(l));
    check('.ai/phase.md records stabilize as current, with a history line dated today', () => {
      const cur = phase.split('\n').find((l) => /^Current:/.test(l)) || '';
      const hist = phase.split('\n').find((l) => l.includes(today) && /stabili/i.test(l));
      return [/stabilize/i.test(cur) && Boolean(hist), `${cur} | ${hist || 'no history line for today'}`];
    });
    check('AGENTS.md has the STABILIZE contract block', () => {
      const b = block(read('AGENTS.md'), 'project-phase');
      return [/Project phase: STABILIZE/i.test(b), b.split('\n')[1] || 'no block'];
    });
    check('No project files changed: the work was not started without agreement', () => {
      const bad = changed.filter((f) => !isState(f) && f !== 'CLAUDE.md');
      return [bad.length === 0, bad.join(', ') || 'none'];
    });
    check('The gaps found are recorded as at least 3 new open items in .ai/debt.md', () => [newOpen.length >= 3, `${openBefore} open before, ${newOpen.length} new`]);
    check('New debt items carry a priority (must, soon or later)', () => {
      const without = newOpen.filter((l) => !/·\s*(must|soon|later)\b/i.test(l));
      return [newOpen.length > 0 && without.length === 0, without.length ? `without priority: ${without.length}/${newOpen.length}` : `${newOpen.length} with priority`];
    });
    check('The existing in-memory store item is still in .ai/debt.md', () => {
      const l = debt.split('\n').find((x) => /memory/i.test(x));
      return [Boolean(l), l || 'missing'];
    });
  },

  'phase-ask'() {
    const changed = changedFiles();
    check('A /health route was added under src/', () => {
      const f = changed.filter((x) => x.startsWith('src/') && /health/.test(read(x)));
      return [f.length > 0, f.join(', ') || 'no src file mentions health'];
    });
    check('The final message asks the user which phase the project is in', () => {
      const q = phaseQuestions();
      return [q.length > 0, q[0] || 'no question about the phase'];
    });
    check('The final message states the phase assumed meanwhile (production)', () => {
      const l = finalMessage().split('\n').find((x) => /production/i.test(x));
      return [Boolean(l), l || 'production not mentioned'];
    });
    check('Nothing was recorded without an answer: no project-phase block, no .ai/phase.md', () => {
      const rec = Boolean(block(read('AGENTS.md'), 'project-phase')) || /project-phase/.test(read('CLAUDE.md')) || exists('.ai/phase.md');
      return [!rec, rec ? 'phase state written' : 'nothing written'];
    });
    check('Only source, test, changelog or readme files changed', () => {
      const bad = changed.filter((x) => !/^(src|test)\//.test(x) && !['CHANGELOG.md', 'README.md'].includes(x));
      return [bad.length === 0, bad.join(', ') || 'none'];
    });
  },

  'phase-confirmed'() {
    graders['prototype-csv-export']();
    check('The agent did not ask again about the phase (the history confirms prototype for this reason)', () => {
      const q = phaseQuestions();
      return [q.length === 0, q[0] || 'no question about the phase'];
    });
    check('The phase state is unchanged (.ai/phase.md and the block)', () => {
      const same = read('.ai/phase.md') === atBase('.ai/phase.md') && block(read('AGENTS.md'), 'project-phase') === block(atBase('AGENTS.md'), 'project-phase');
      return [same, same ? 'unchanged' : 'changed'];
    });
  },

  'task-done'() {
    const changed = changedFiles();
    check('The list page links to a CSV download with all 3 items, separated by semicolons', () => {
      const http = callHttpHandler(path.join(repo, 'server.js'), ['/']);
      if (!http.link) return [false, 'no link containing "csv" found on the list page'];
      const body = http.csv?.body || '';
      const all = ['Microphone stand', 'XLR cable 5m', 'Headphones'].every((n) => body.includes(n));
      return [http.csv?.status === 200 && all && body.includes(';'), `link ${http.link}, status ${http.csv?.status}, all items: ${all}, semicolons: ${body.includes(';')}`];
    });
    check('The test suite passes', () => {
      const t = testsPass();
      return [t.ok, t.summary];
    });
    check('No dependency was added', () => [deps(read('package.json')) === deps(atBase('package.json')), `after: ${deps(read('package.json'))}`]);
    check('The final message suggests /finish without recommending a mode', () => {
      const msg = finalMessage();
      const sug = /\/finish\b/.test(msg);
      const mode = msg.match(/\/finish\s+(merge|mr|pr|merge-request|pull-request)\b/);
      return [sug && !mode, sug ? (mode ? `names a mode: ${mode[0]}` : 'suggested, no mode') : 'no /finish'];
    });
    check('Closing is left to /finish: docs/tasks/csv-export.md and the handoff are still there, still on feature/csv-export', () => {
      const t = exists('docs/tasks/csv-export.md');
      const h = exists('.ai/handoff/feature-csv-export.md');
      const cur = git('branch', '--show-current').trim();
      return [t && h && cur === 'feature/csv-export', `task ${t ? 'kept' : 'deleted'}, handoff ${h ? 'kept' : 'deleted'}, branch ${cur}`];
    });
    check('Nobody was assigned by the agent: pdf-labels.md unchanged, new task files have no Assignee', () => {
      const assigned = changed.filter((x) => x.startsWith('docs/tasks/') && !atBase(x) && /^Assignee:/m.test(read(x)));
      const ok = !changed.includes('docs/tasks/pdf-labels.md') && assigned.length === 0;
      return [ok, `pdf-labels changed: ${changed.includes('docs/tasks/pdf-labels.md')}, assigned: ${assigned.join(', ') || 'none'}`];
    });
    check('New journal entries name the branch feature/csv-export in the header', () => {
      const heads = newJournalHeads();
      return [heads.length > 0 && heads.every((l) => l.includes('feature/csv-export')), heads.join(' | ') || 'no new entries'];
    });
  },
  'backlog-list'() {
    const changed = changedFiles();
    const msg = finalMessage();
    check('No task files, handoff or project files changed (only the journal may get an entry)', () => {
      const bad = changed.filter((f) => !f.startsWith('.ai/journal/'));
      return [bad.length === 0, bad.join(', ') || 'only the journal'];
    });
    check("The final message puts the current branch's next step (the /items.csv route) before the other tasks", () => {
      const step = msg.search(/items\.csv/);
      const other = msg.search(/pdf|label/i);
      return [step >= 0 && (other < 0 || step < other), `items.csv at ${step}, pdf-labels at ${other}`];
    });
    check('The final message lists pdf-labels with its assignee @mrossi', () => {
      const l = msg.split('\n').find((x) => /pdf|label/i.test(x) && /mrossi/.test(x));
      return [Boolean(l), l || 'not found on one line'];
    });
    check('The final message marks the CSV export task as in progress', () => {
      const l = msg.split('\n').find((x) => /csv/i.test(x) && /progress|handoff|in corso|current branch|feature\/csv-export/i.test(x));
      return [Boolean(l), l || 'no in-progress mark'];
    });
    check('Nobody was assigned or reassigned', () => [!changed.some((f) => f.startsWith('docs/tasks/')), 'docs/tasks/ unchanged']);
  },
  'backlog-list-gitlab'() {
    const changed = changedFiles();
    const msg = finalMessage();
    check('The final message says the issues could not be read and gives the glab login command', () => {
      const l = msg.split('\n').find((x) => /glab auth login/.test(x));
      return [Boolean(l), l || 'no `glab auth login`'];
    });
    check('No issues were invented (no issue numbers in the final message)', () => {
      const m = msg.match(/(^|[\s(])#\d+\b/m);
      return [!m, m ? m[0].trim() : 'none'];
    });
    check('No task folder (docs/backlog/, docs/tasks/, docs/todo/) or other task list was created', () => {
      const bad = changed.filter((f) => /^(docs\/(backlog|tasks|todo)\/|ROADMAP\.md|TODO\.md)/.test(f));
      return [bad.length === 0, bad.join(', ') || 'none'];
    });
    check('No project files changed (only the journal may get an entry)', () => {
      const bad = changed.filter((f) => !f.startsWith('.ai/journal/'));
      return [bad.length === 0, bad.join(', ') || 'only the journal'];
    });
  },
  'setup-gitlab'() {
    const changed = changedFiles();
    const instr = read('AGENTS.md') + '\n' + read('CLAUDE.md');
    const line = instr.split('\n').find((x) => /^\s*-\s*Tasks:/i.test(x)) || '';
    check('The always-loaded instructions name GitLab issues as the task list', () => [/gitlab/i.test(line), line || 'no Tasks line']);
    check("Writes to the tracker need the user's confirmation, as the block says", () => [/confirm/i.test(line), line || 'no Tasks line']);
    check('No task folder (docs/backlog/, docs/tasks/, docs/todo/) was created', () => {
      const bad = changed.filter((f) => /^docs\/(backlog|tasks|todo)\//.test(f));
      return [bad.length === 0, bad.join(', ') || 'none'];
    });
    check('.gitattributes has merge=union for the journal', () => [/\.ai\/journal\/\*\.md\s+merge=union/.test(read('.gitattributes')), read('.gitattributes').trim() || 'missing']);
    check('No source files were modified', () => {
      const bad = changed.filter((f) => !isState(f) && f !== 'CLAUDE.md' && !f.startsWith('docs/'));
      return [bad.length === 0, bad.join(', ') || 'none'];
    });
  },
  'setup-jira'() {
    const changed = changedFiles();
    const instr = read('AGENTS.md') + '\n' + read('CLAUDE.md');
    const line = instr.split('\n').find((x) => /^\s*-\s*Tasks:/i.test(x)) || '';
    check('The always-loaded instructions name Jira project ITEMS as the task list', () => [/jira/i.test(line) && /\bITEMS\b/.test(line), line || 'no Tasks line']);
    check("Writes to the tracker need the user's confirmation, as the block says", () => [/confirm/i.test(line), line || 'no Tasks line']);
    check('No task folder (docs/backlog/, docs/tasks/, docs/todo/) was created', () => {
      const bad = changed.filter((f) => /^docs\/(backlog|tasks|todo)\//.test(f));
      return [bad.length === 0, bad.join(', ') || 'none'];
    });
    check('.gitattributes has merge=union for the journal', () => [/\.ai\/journal\/\*\.md\s+merge=union/.test(read('.gitattributes')), read('.gitattributes').trim() || 'missing']);
    check('No source files were modified', () => {
      const bad = changed.filter((f) => !isState(f) && f !== 'CLAUDE.md' && !f.startsWith('docs/'));
      return [bad.length === 0, bad.join(', ') || 'none'];
    });
  },
  'backlog-close-jira'() {
    const changed = changedFiles();
    const msg = finalMessage();
    check('The final message gives the acli login command', () => [/acli jira auth login/.test(msg), /acli jira auth login/.test(msg) ? 'found' : 'missing']);
    const t = /acli jira workitem transition[^\n]*ITEMS-14/;
    check('The final message gives an acli transition command for ITEMS-14', () => [t.test(msg), t.test(msg) ? 'found' : 'missing']);
    check('No project files changed (only the journal may get an entry)', () => {
      const bad = changed.filter((f) => !f.startsWith('.ai/journal/'));
      return [bad.length === 0, bad.join(', ') || 'only the journal'];
    });
  },
  'backlog-filter-jira'() {
    const changed = changedFiles();
    const msg = finalMessage();
    check('The final message gives the acli login command', () => [/acli jira auth login/.test(msg), /acli jira auth login/.test(msg) ? 'found' : 'missing']);
    const q = /acli jira workitem search[^\n]*parent\s*=\s*ITEMS-10/;
    check('The final message gives an acli search whose JQL has parent = ITEMS-10', () => [q.test(msg), q.test(msg) ? 'found' : 'missing']);
    check('No project files changed (only the journal may get an entry)', () => {
      const bad = changed.filter((f) => !f.startsWith('.ai/journal/'));
      return [bad.length === 0, bad.join(', ') || 'only the journal'];
    });
  },
  'backlog-help'() {
    const changed = changedFiles();
    const msg = finalMessage();
    check('The final message names the subcommands new, comment, close and filter', () => {
      const miss = ['new', 'comment', 'close', 'filter'].filter((c) => !new RegExp('backlog ' + c + '\\b').test(msg));
      return [miss.length === 0, miss.length ? 'missing: ' + miss.join(', ') : 'all found'];
    });
    check('The final message says where the tasks are (docs/tasks/)', () => [/docs\/tasks/.test(msg), /docs\/tasks/.test(msg) ? 'found' : 'missing']);
    check('No project files changed (only the journal may get an entry)', () => {
      const bad = changed.filter((f) => !f.startsWith('.ai/journal/'));
      return [bad.length === 0, bad.join(', ') || 'only the journal'];
    });
  },
  'backlog-new-jira-parent'() {
    const changed = changedFiles();
    const msg = finalMessage();
    const i = msg.indexOf('acli jira workitem create');
    const c = i < 0 ? '' : msg.slice(i, i + 800);
    check('The final message gives an acli workitem create command for project ITEMS with --parent ITEMS-10', () => [/--project\s+"?ITEMS\b/.test(c) && /--parent\s+"?ITEMS-10\b/.test(c), c || 'no create command']);
    check('No project files changed (only the journal may get an entry)', () => {
      const bad = changed.filter((f) => !f.startsWith('.ai/journal/'));
      return [bad.length === 0, bad.join(', ') || 'only the journal'];
    });
  },
  'setup-review-jira'() {
    const changed = changedFiles();
    const lines = read('AGENTS.md').split('\n');
    const tasks = lines.find((x) => /^\s*-\s*Tasks:/i.test(x)) || '';
    const dd = lines.find((x) => /^\s*-\s*Design decisions:/i.test(x)) || '';
    check('The Tasks line now names Jira project ITEMS', () => [/jira/i.test(tasks) && /\bITEMS\b/.test(tasks), tasks || 'no Tasks line']);
    check('The Design decisions line is unchanged (docs/design/)', () => [/docs\/design\//.test(dd), dd || 'no Design decisions line']);
    check('The existing journal entry is kept', () => {
      const j = '.ai/journal/2026-09-29.md';
      return [read(j).startsWith(atBase(j).trimEnd()), read(j).startsWith(atBase(j).trimEnd()) ? 'kept' : 'changed'];
    });
    check('No other project files changed (AGENTS.md, the journal, a missing .gitattributes line)', () => {
      const bad = changed.filter((f) => f !== 'AGENTS.md' && f !== '.gitattributes' && !f.startsWith('.ai/journal/'));
      return [bad.length === 0, bad.join(', ') || 'none'];
    });
  },
  'backlog-assign-alias'() {
    const changed = changedFiles();
    const msg = finalMessage();
    const l = msg.split('\n').find((x) => /acli jira workitem (assign|edit)/.test(x) && /ITEMS-14/.test(x) && /712020:3f1c-simone/.test(x));
    check('The final message gives an acli assign or edit command for ITEMS-14 with the account ID 712020:3f1c-simone', () => [Boolean(l), l || 'missing']);
    check('No project files changed (only the journal may get an entry)', () => {
      const bad = changed.filter((f) => !f.startsWith('.ai/journal/'));
      return [bad.length === 0, bad.join(', ') || 'only the journal'];
    });
  },
  'backlog-new-sprint'() {
    const changed = changedFiles();
    const msg = finalMessage();
    const i = msg.indexOf('acli jira workitem create');
    const c = i < 0 ? '' : msg.slice(i, i + 800);
    check('The final message gives an acli workitem create command for project ITEMS', () => [/--project\s+"?ITEMS\b/.test(c), c ? 'found' : 'no create command']);
    check('No acli command in the final message sets a sprint (searches excepted)', () => {
      const bad = msg.split('\n').filter((x) => /acli/.test(x) && /sprint|customfield/i.test(x) && !/workitem search/.test(x));
      return [bad.length === 0, bad.join(' | ') || 'none'];
    });
    check('No project files changed (only the journal may get an entry)', () => {
      const bad = changed.filter((f) => !f.startsWith('.ai/journal/'));
      return [bad.length === 0, bad.join(', ') || 'only the journal'];
    });
  },
  'backlog-list-jira-sprint'() {
    const changed = changedFiles();
    const msg = finalMessage();
    check('The final message gives the acli login command', () => [/acli jira auth login/.test(msg), /acli jira auth login/.test(msg) ? 'found' : 'missing']);
    const sp = /openSprints\(\)|current sprint/i;
    check('The final message gives the sprint-first searches or says the current sprint comes first', () => [sp.test(msg), sp.test(msg) ? 'found' : 'missing']);
    check('No project files changed (only the journal may get an entry)', () => {
      const bad = changed.filter((f) => !f.startsWith('.ai/journal/'));
      return [bad.length === 0, bad.join(', ') || 'only the journal'];
    });
  },
  'start-task'() {
    const changed = changedFiles();
    const cur = git('branch', '--show-current').trim();
    check('The current branch is feature/pdf-labels', () => [cur === 'feature/pdf-labels', cur]);
    const h = '.ai/handoff/feature-pdf-labels.md';
    check('The handoff .ai/handoff/feature-pdf-labels.md exists and says Base: develop', () => [/Base:\s*`?develop`?/.test(read(h)), exists(h) ? (read(h).match(/^.*Base:.*$/m) || ['no Base line'])[0] : 'missing']);
    check('develop is unchanged', () => {
      const dev = git('rev-parse', 'develop').trim();
      return [dev === base, dev === base ? 'unchanged' : `develop at ${dev.slice(0, 7)}, was ${base.slice(0, 7)}`];
    });
    check('No source files changed (only .ai/ and the task file may change)', () => {
      const bad = changed.filter((f) => !f.startsWith('.ai/') && f !== 'docs/tasks/pdf-labels.md');
      return [bad.length === 0, bad.join(', ') || 'none'];
    });
  },
  'finish-no-mode'() {
    const msg = finalMessage();
    check('The final message names the modes merge, mr and pr', () => {
      const miss = ['merge', 'mr', 'pr'].filter((m) => !new RegExp('\\b' + m + '\\b').test(msg));
      return [miss.length === 0, miss.length ? 'missing: ' + miss.join(', ') : 'all found'];
    });
    check('Nothing changed: same branch, same commit, no changed files', () => {
      const head = git('rev-parse', 'HEAD').trim();
      const ch = changedFiles();
      return [head === base && ch.length === 0, `HEAD ${head === base ? 'same' : 'moved'}; changed: ${ch.join(', ') || 'none'}`];
    });
  },
  'finish-help'() {
    const msg = finalMessage();
    check('The final message names the modes merge, merge-request and pull-request', () => {
      const miss = ['merge', 'merge-request', 'pull-request'].filter((m) => !new RegExp('\\b' + m + '\\b').test(msg));
      return [miss.length === 0, miss.length ? 'missing: ' + miss.join(', ') : 'all found'];
    });
    check('The final message names develop as the base', () => [/\bdevelop\b/.test(msg), /\bdevelop\b/.test(msg) ? 'found' : 'missing']);
    check('Nothing changed: same branch, same commit, no changed files', () => {
      const head = git('rev-parse', 'HEAD').trim();
      const ch = changedFiles();
      return [head === base && ch.length === 0, `HEAD ${head === base ? 'same' : 'moved'}; changed: ${ch.join(', ') || 'none'}`];
    });
  },
  'finish-merge-base'() {
    const anc = (b) => spawnSync('git', ['-C', repo, 'merge-base', '--is-ancestor', base, b]).status === 0;
    check('develop contains the feature work', () => [anc('develop'), anc('develop') ? 'merged' : 'not merged']);
    check('main does not contain the feature work', () => [!anc('main'), anc('main') ? 'merged into main' : 'main untouched']);
    check('The current branch is develop and feature/csv-helper is deleted', () => {
      const cur = git('branch', '--show-current').trim();
      const still = git('branch', '--list', 'feature/csv-helper').trim();
      return [cur === 'develop' && !still, `current ${cur}; feature branch ${still ? 'still there' : 'deleted'}`];
    });
    check('On develop, the handoff and docs/tasks/csv-helper.md are gone and a journal entry exists', () => {
      const files = git('ls-tree', '-r', '--name-only', 'develop').split('\n');
      const h = files.includes('.ai/handoff/feature-csv-helper.md');
      const t = files.includes('docs/tasks/csv-helper.md');
      const j = files.some((f) => f.startsWith('.ai/journal/'));
      return [!h && !t && j, `handoff ${h ? 'present' : 'gone'}, task ${t ? 'present' : 'gone'}, journal ${j ? 'yes' : 'no'}`];
    });
  },
  'finish-pr'() {
    const msg = finalMessage();
    const anc = spawnSync('git', ['-C', repo, 'merge-base', '--is-ancestor', base, 'develop']).status === 0;
    check('develop is unchanged', () => [!anc, anc ? 'feature merged into develop' : 'unchanged']);
    check('The cleanup is committed on the branch (no handoff in HEAD)', () => {
      const files = git('ls-tree', '-r', '--name-only', 'feature/csv-helper').split('\n');
      const h = files.includes('.ai/handoff/feature-csv-helper.md');
      return [!h, h ? 'handoff still in the branch' : 'handoff deleted in a commit'];
    });
    const pushRe = /git push -u origin feature\/csv-helper|git push --set-upstream origin feature\/csv-helper/;
    check('The final message gives the push command for feature/csv-helper', () => [pushRe.test(msg), pushRe.test(msg) ? 'found' : 'missing']);
    const prRe = /gh pr create[^\n]*(--base|-B)\s+develop/;
    check('The final message gives gh pr create with --base develop', () => [prRe.test(msg), prRe.test(msg) ? 'found' : 'missing']);
  },
  'finish-pr-instructions'() {
    graders['finish-pr']();
    const cmd = (finalMessage().match(/gh pr create[^\n]*/g) || []).join(' ');
    const ok = /--draft|(^|\s)-d\b/.test(cmd) && /(--label|-l)[ =]"?csv\b/.test(cmd);
    check('The gh pr create command has --draft and --label csv', () => [ok, cmd || 'no gh pr create']);
  },
  'start-gitflow'() {
    const changed = changedFiles();
    const cur = git('branch', '--show-current').trim();
    check('The current branch is feature/pdf-labels', () => [cur === 'feature/pdf-labels', cur]);
    const dev = git('rev-parse', 'develop').trim();
    const fromDev = spawnSync('git', ['-C', repo, 'merge-base', '--is-ancestor', dev, 'feature/pdf-labels']).status === 0;
    check("The branch starts from develop's tip, not from main", () => [fromDev, fromDev ? 'develop tip is an ancestor' : 'not based on develop']);
    const h = '.ai/handoff/feature-pdf-labels.md';
    check('The handoff .ai/handoff/feature-pdf-labels.md exists and says Base: develop', () => [/Base:\s*`?develop`?/.test(read(h)), exists(h) ? (read(h).match(/^.*Base:.*$/m) || ['no Base line'])[0] : 'missing']);
    const devLog = git('log', '-1', '--format=%s', 'develop').trim();
    check('develop is unchanged', () => [devLog === 'Show tags in list', devLog]);
    check('No source files changed (only .ai/ and the task file may change)', () => {
      const bad = changed.filter((f) => !f.startsWith('.ai/') && f !== 'docs/tasks/pdf-labels.md');
      return [bad.length === 0, bad.join(', ') || 'none'];
    });
  },
  'finish-gitflow-merge'() {
    graders['finish-merge-base']();
    const msg = finalMessage();
    check('The final message says git flow feature finish was used', () => [/git flow feature finish/.test(msg), /git flow feature finish/.test(msg) ? 'found' : 'missing']);
  },
  'setup-team'() {
    const changed = changedFiles();
    check('.ai/team.md does not exist', () => [!exists('.ai/team.md'), exists('.ai/team.md') ? 'exists' : 'absent']);
    const msg = finalMessage();
    check('The final message does not mention team.md or propose a team file', () => [!/team\.md|team file/i.test(msg), (msg.match(/^.*(team\.md|team file).*$/im) || ['none'])[0]]);
    check('No source files were modified', () => {
      const bad = changed.filter((f) => !isState(f) && f !== 'CLAUDE.md' && f !== '.gitignore' && !f.startsWith('docs/'));
      return [bad.length === 0, bad.join(', ') || 'none'];
    });
  },
  'team-on-request'() {
    const changed = changedFiles();
    check('.ai/team.md does not exist', () => [!exists('.ai/team.md'), exists('.ai/team.md') ? 'exists' : 'absent']);
    const msg = finalMessage();
    check('The final message warns that the file holds personal data', () => [/personal/i.test(msg), (msg.match(/^.*personal.*$/im) || ['missing'])[0]]);
    check('The final message asks whether to continue', () => [/\?/.test(msg), (msg.match(/^.*\?.*$/m) || ['no question'])[0]]);
    check('No project files changed (AGENTS.md, CLAUDE.md, .gitattributes and .ai/ aside)', () => {
      const bad = changed.filter((f) => !isState(f) && f !== 'CLAUDE.md');
      return [bad.length === 0, bad.join(', ') || 'none'];
    });
  },
  'finish-docs-example'() {
    const msg = finalMessage();
    const merged = spawnSync('git', ['-C', repo, 'merge-base', '--is-ancestor', base, 'develop']).status === 0;
    check("Nothing was merged: develop doesn't contain the feature work", () => [!merged, merged ? 'merged' : 'not merged']);
    check('The branch is untouched: still checked out, same commit, handoff still there', () => {
      const cur = git('branch', '--show-current').trim();
      const head = git('rev-parse', 'HEAD').trim();
      const h = exists('.ai/handoff/feature-csv-helper.md');
      return [cur === 'feature/csv-helper' && head === base && h, `branch ${cur}, HEAD ${head === base ? 'same' : 'moved'}, handoff ${h ? 'there' : 'gone'}`];
    });
    const ok = /bin\/export\.js|csv-export\.md/.test(msg) && /example|esempio/i.test(msg);
    check('The final message names the missing example for bin/export.js', () => [ok, ok ? 'found' : 'missing']);
  },
  'backlog-new'() {
    const changed = changedFiles();
    const added = changed.filter((f) => f.startsWith('docs/tasks/') && !atBase(f) && exists(f));
    check('Exactly one new task file in docs/tasks/, with a title and a Why line', () => {
      const ok = added.length === 1 && /^# \S/m.test(read(added[0])) && /^Why:/m.test(read(added[0]));
      return [ok, added.join(', ') || 'no new task file'];
    });
    check('The new task file has no Assignee', () => [added.length > 0 && !added.some((f) => /^Assignee:/m.test(read(f))), added.join(', ') || 'no new task file']);
    check('The existing task files are unchanged', () => {
      const bad = changed.filter((f) => f.startsWith('docs/tasks/') && atBase(f));
      return [bad.length === 0, bad.join(', ') || 'unchanged'];
    });
    check('No other project files changed (only the journal may get an entry)', () => {
      const bad = changed.filter((f) => !f.startsWith('.ai/journal/') && !added.includes(f));
      return [bad.length === 0, bad.join(', ') || 'none'];
    });
  },
  'backlog-close-gitlab'() {
    const changed = changedFiles();
    const msg = finalMessage();
    check('The final message gives the glab login command', () => [/glab auth login/.test(msg), /glab auth login/.test(msg) ? 'found' : 'missing']);
    check('The final message gives the exact command glab issue close 7', () => [/glab issue close 7\b/.test(msg), /glab issue close 7\b/.test(msg) ? 'found' : 'missing']);
    check('No project files changed (only the journal may get an entry)', () => {
      const bad = changed.filter((f) => !f.startsWith('.ai/journal/'));
      return [bad.length === 0, bad.join(', ') || 'only the journal'];
    });
  },
  'backlog-comment'() {
    const changed = changedFiles();
    const f = 'docs/tasks/pdf-labels.md';
    const before = atBase(f);
    const after = read(f);
    check('docs/tasks/pdf-labels.md has a ## Notes heading with a dated line mentioning A6', () => {
      const notes = after.split(/^## Notes\s*$/m)[1] || '';
      const l = notes.split('\n').find((x) => /\d{4}-\d{2}-\d{2}/.test(x) && /A6/.test(x));
      return [Boolean(l), l || 'no dated A6 line under ## Notes'];
    });
    check('The rest of pdf-labels.md is unchanged (title, Assignee, Why, Done when)', () => {
      const head = after.split(/^## Notes\s*$/m)[0].trimEnd();
      return [head === before.trimEnd(), head === before.trimEnd() ? 'unchanged' : 'changed above ## Notes'];
    });
    check('No other project files changed (only the journal may get an entry)', () => {
      const bad = changed.filter((x) => !x.startsWith('.ai/journal/') && x !== f);
      return [bad.length === 0, bad.join(', ') || 'none'];
    });
  },
  'backlog-comment-gitlab'() {
    const changed = changedFiles();
    const msg = finalMessage();
    check('The final message gives the glab login command', () => [/glab auth login/.test(msg), /glab auth login/.test(msg) ? 'found' : 'missing']);
    check('The final message gives the exact command glab issue note 7', () => [/glab issue note 7\b/.test(msg), /glab issue note 7\b/.test(msg) ? 'found' : 'missing']);
    check('No project files changed (only the journal may get an entry)', () => {
      const bad = changed.filter((x) => !x.startsWith('.ai/journal/'));
      return [bad.length === 0, bad.join(', ') || 'only the journal'];
    });
  },
};
graders['setup-production-repo-fr'] = graders['setup-production-repo'];
graders['resume-from-handoff-de'] = graders['resume-from-handoff'];

if (!graders[evalName]) {
  console.error(`unknown eval: ${evalName}`);
  process.exit(2);
}
graders[evalName]();

const manualPath = path.join(runDir, 'manual.json');
if (fs.existsSync(manualPath)) {
  // A manual entry with the same text as a programmatic one overrides it.
  for (const m of JSON.parse(fs.readFileSync(manualPath, 'utf8'))) {
    const i = results.findIndex((r) => r.text === m.text);
    if (i >= 0) results[i] = m;
    else results.push(m);
  }
}

const passed = results.filter((r) => r.passed).length;
const grading = {
  expectations: results,
  summary: { passed, failed: results.length - passed, total: results.length, pass_rate: Number((passed / results.length).toFixed(2)) },
};
fs.writeFileSync(path.join(runDir, 'grading.json'), JSON.stringify(grading, null, 2) + '\n');
console.log(`${evalName}: ${passed}/${results.length}`);
for (const r of results) console.log(`  ${r.passed ? 'PASS' : 'FAIL'}  ${r.text}\n        ${r.evidence}`);
