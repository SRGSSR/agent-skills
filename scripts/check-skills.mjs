// Checks the plugins and skills the way their consumers read them.
// Run: npm install --no-save yaml@2.9.1 && node scripts/check-skills.mjs
// CI runs it too (.github/workflows/checks.yml), with `claude plugin validate`.
//
// - Every SKILL.md frontmatter parses with the strict YAML parser that `npx skills`
//   uses: a plain value containing ": " made it skip two skills once.
// - name matches the folder, description is a string under 1024 characters,
//   metadata.version is semver.
// - Every plugin in the marketplace has its folder and a plugin.json with a semver
//   version; the marketplace entry has no version (it lives only in plugin.json).
// - Relative links in Markdown files point to files that exist.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, normalize } from 'node:path';
import { parse } from 'yaml';

const errors = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);
const semver = /^\d+\.\d+\.\d+$/;

const marketplace = JSON.parse(readFileSync('.claude-plugin/marketplace.json', 'utf8'));
const pluginDirs = new Set();
for (const p of marketplace.plugins) {
  const where = `marketplace.json plugin ${p.name}`;
  const dir = normalize(p.source);
  pluginDirs.add(dir);
  if ('version' in p) fail(where, 'has a version; keep it only in plugin.json');
  const manifest = join(dir, '.claude-plugin', 'plugin.json');
  if (!existsSync(manifest)) { fail(where, `missing ${manifest}`); continue; }
  const pj = JSON.parse(readFileSync(manifest, 'utf8'));
  if (pj.name !== p.name) fail(manifest, `name "${pj.name}" differs from the marketplace entry "${p.name}"`);
  if (!semver.test(pj.version ?? '')) fail(manifest, `version "${pj.version}" is not semver`);
}

let skills = 0;
for (const plugin of readdirSync('plugins')) {
  if (!pluginDirs.has(join('plugins', plugin))) fail(`plugins/${plugin}`, 'not listed in marketplace.json');
  const skillsDir = join('plugins', plugin, 'skills');
  if (!existsSync(skillsDir)) continue;
  for (const name of readdirSync(skillsDir)) {
    const file = join(skillsDir, name, 'SKILL.md');
    if (!existsSync(file)) continue;
    skills++;
    const m = readFileSync(file, 'utf8').match(/^---\n([\s\S]*?)\n---\n/);
    if (!m) { fail(file, 'no frontmatter'); continue; }
    let fm;
    try { fm = parse(m[1]); } catch (e) { fail(file, `frontmatter is not valid YAML: ${e.message.split('\n')[0]}`); continue; }
    if (fm?.name !== name) fail(file, `name "${fm?.name}" differs from the folder "${name}"`);
    if (typeof fm?.description !== 'string') fail(file, 'description is not a string');
    else if (fm.description.length >= 1024) fail(file, `description is ${fm.description.length} characters (limit 1024)`);
    if (!semver.test(fm?.metadata?.version ?? '')) fail(file, `metadata.version "${fm?.metadata?.version}" is not semver`);
  }
}
if (skills === 0) fail('plugins', 'no skills found');

const markdown = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    if (['.git', 'node_modules', 'journal', 'fixtures'].includes(entry)) continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path);
    else if (entry.endsWith('.md')) markdown.push(path);
  }
};
walk('.');
for (const file of markdown) {
  const text = readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
  for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    const path = target.split('#')[0];
    if (path && !existsSync(join(dirname(file), path))) fail(file, `broken link ${target}`);
  }
}

if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join('\n'));
  process.exit(1);
}
console.log(`✓ ${marketplace.plugins.length} plugins, ${skills} skills, ${markdown.length} Markdown files checked`);
