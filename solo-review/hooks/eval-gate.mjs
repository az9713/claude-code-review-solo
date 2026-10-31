// Eval gate. CLI: node eval-gate.mjs <check|lint|reset|status> <FR-NN> [--lint]
// Also imported by guard.mjs. Exit 0 = pass, 1 = problems, 2 = usage error.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const STATUSES = ['draft', 'in-review', 'reviewed', 'building', 'done'];
const TYPES = ['use', 'fail', 'regression', 'design'];
// ponytail: fixed minimums per risk level, tune here if the evals feel too loose or too strict
const MIN = {
  low: { total: 3, use: 1, fail: 1, regression: 1 },
  medium: { total: 5, use: 1, fail: 1, regression: 1 },
  high: { total: 8, use: 1, fail: 2, regression: 2 },
};

export function findRoot(cwd) {
  let d = path.resolve(cwd);
  for (;;) {
    if (fs.existsSync(path.join(d, 'specs'))) return d;
    const p = path.dirname(d);
    if (p === d) return null;
    d = p;
  }
}

export function resolveFeature(root, id) {
  const specs = path.join(root, 'specs');
  if (!fs.existsSync(specs)) return null;
  const k = id.toLowerCase();
  const hit = fs.readdirSync(specs).find((n) => {
    const l = n.toLowerCase();
    return l === k || l.startsWith(k + '-');
  });
  return hit ? path.join(specs, hit) : null;
}

export function parseEval(text) {
  const fm = {};
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (m) for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  const checks = [];
  let cur = null;
  for (const line of text.split(/\r?\n/)) {
    const h = line.match(/^###\s+(EV-\d+)\s*(.*)$/);
    if (h) { cur = { id: h[1], title: h[2], f: {} }; checks.push(cur); continue; }
    if (/^#{1,2}\s/.test(line)) { cur = null; continue; }
    const kv = cur && line.match(/^-\s+(type|how|expect|result|evidence):\s*(.*)$/);
    if (kv) cur.f[kv[1]] = kv[2].trim();
  }
  return { fm, checks };
}

// opts.results: require every check to be PASS. opts.lint: require good structure. opts.dir: feature folder.
export function evaluate(text, { results = true, lint = false, dir = null } = {}) {
  const { fm, checks } = parseEval(text);
  const problems = [];
  if (!checks.length) problems.push('eval.md has no checks (### EV-01 ... blocks).');
  if (results) for (const c of checks) {
    const r = (c.f.result || '').toUpperCase();
    if (r !== 'PASS') problems.push(`${c.id} is ${r || 'missing result'}${c.title ? ' (' + c.title + ')' : ''}`);
  }
  if (lint) {
    if (!STATUSES.includes(fm.status)) problems.push(`status must be one of ${STATUSES.join(', ')} (got "${fm.status || ''}").`);
    const risk = MIN[fm.risk];
    if (!risk) problems.push(`risk must be low, medium or high (got "${fm.risk || ''}").`);
    for (const c of checks) {
      if (!TYPES.includes(c.f.type)) problems.push(`${c.id}: type must be ${TYPES.join('|')}.`);
      if (!c.f.how || /^\{\{/.test(c.f.how)) problems.push(`${c.id}: "how" is empty. An agent must be able to run it.`);
      if (!c.f.expect || /^\{\{/.test(c.f.expect)) problems.push(`${c.id}: "expect" is empty.`);
      if (results && (c.f.result || '').toUpperCase() === 'PASS' && !c.f.evidence) problems.push(`${c.id}: PASS needs evidence.`);
    }
    if (risk) {
      const n = (t) => checks.filter((c) => c.f.type === t).length;
      if (checks.length < risk.total) problems.push(`risk ${fm.risk} needs at least ${risk.total} checks (has ${checks.length}).`);
      for (const t of ['use', 'fail', 'regression']) if (n(t) < risk[t]) problems.push(`risk ${fm.risk} needs at least ${risk[t]} "${t}" check(s) (has ${n(t)}).`);
    }
    if (dir && fs.existsSync(path.join(dir, 'mockup.html')) && !checks.some((c) => c.f.type === 'design'))
      problems.push('mockup.html exists but no check has type: design.');
  }
  return { ok: problems.length === 0, problems, fm, checks };
}

export function resetResults(text) {
  return text.replace(/^(-\s+result:).*$/gm, '$1 PENDING').replace(/^(-\s+evidence:).*$/gm, '$1');
}

function main() {
  const [cmd, id, ...flags] = process.argv.slice(2);
  const root = findRoot(process.cwd());
  const dir = root && id ? resolveFeature(root, id) : null;
  if (!['check', 'lint', 'reset', 'status'].includes(cmd) || !id) {
    console.error('usage: eval-gate.mjs <check|lint|reset|status> <FR-NN> [--lint]'); process.exit(2);
  }
  if (!dir) { console.error(`No folder specs/${id}* found from ${process.cwd()}.`); process.exit(2); }
  const file = path.join(dir, 'eval.md');
  if (!fs.existsSync(file)) { console.error(`Missing ${file}`); process.exit(1); }
  const text = fs.readFileSync(file, 'utf8');
  if (cmd === 'status') { console.log(parseEval(text).fm.status || ''); return; }
  if (cmd === 'reset') { fs.writeFileSync(file, resetResults(text)); console.log('All results reset to PENDING.'); return; }
  const r = evaluate(text, { results: cmd === 'check', lint: cmd === 'lint' || flags.includes('--lint'), dir });
  const pass = r.checks.filter((c) => (c.f.result || '').toUpperCase() === 'PASS').length;
  console.log(`${path.basename(dir)}: ${pass}/${r.checks.length} checks PASS, status=${r.fm.status}, risk=${r.fm.risk}`);
  for (const p of r.problems) console.log(' - ' + p);
  console.log(r.ok ? 'GATE: PASS' : 'GATE: FAIL');
  process.exit(r.ok ? 0 : 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
