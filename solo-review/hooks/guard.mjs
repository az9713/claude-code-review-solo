// PreToolUse hook for the solo-review plugin. Runs on every tool call, so it must be fast and must
// do nothing in a project that has no specs/ folder. Exit 2 = block (reason on stderr).
import fs from 'node:fs';
import path from 'node:path';
import { evaluate, findRoot, resolveFeature, parseEval } from './eval-gate.mjs';

const EDIT_TOOLS = ['Write', 'Edit', 'MultiEdit', 'NotebookEdit'];
const deny = (m) => { console.error(m); process.exit(2); };
const ask = (m) => {
  console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'ask', permissionDecisionReason: m } }));
  process.exit(0);
};

try {
  const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  const tool = input.tool_name || '';
  const ti = input.tool_input || {};
  const role = (input.agent_type || '').split(':').pop(); // plugin agents may arrive as "solo-review:builder"

  // 1. First-time-user agent: it may only use the browser. No code, no docs, no shell.
  if (role === 'first-time-user') {
    if (tool.startsWith('mcp__chrome-devtools__') && !tool.endsWith('evaluate_script')) process.exit(0);
    deny(`first-time-user may only use browser tools. "${tool}" is blocked: a first-time user cannot read the code, the docs or run commands.`);
  }

  const root = findRoot(input.cwd || process.cwd());
  if (!root) process.exit(0); // not a project that uses solo-review

  const file = String(ti.file_path || ti.notebook_path || '').replace(/\\/g, '/');
  const evalMatch = file.match(/\/specs\/([^/]+)\/eval\.md$/);

  // 2. Role limits for the loop agents.
  if (EDIT_TOOLS.includes(tool) && role === 'builder') {
    if (evalMatch) deny('builder may not edit eval.md. Only the verifier writes results. If an eval is wrong, return "DECISION NEEDED".');
    const st = path.join(root, '.review', 'state.md');
    if (fs.existsSync(st)) {
      const f = (fs.readFileSync(st, 'utf8').match(/^feature:\s*(\S+)/m) || [])[1];
      const dir = f && resolveFeature(root, f);
      const ev = dir && path.join(dir, 'eval.md');
      const status = ev && fs.existsSync(ev) ? parseEval(fs.readFileSync(ev, 'utf8')).fm.status : null;
      if (status && !['reviewed', 'building'].includes(status)) deny(`Build blocked: ${f} has status "${status}". The user must review the evals first (status reviewed).`);
    }
  }
  if (EDIT_TOOLS.includes(tool) && role === 'verifier' && !evalMatch && !/\/\.review\//.test(file))
    deny('verifier may only edit eval.md (results and evidence) and files in .review/. It must not fix app code.');

  // 3. Status changes in eval.md.
  if (tool === 'Bash' && /eval\.md/.test(ti.command || '') && /status:\s*(done|reviewed|building)/.test(ti.command || ''))
    deny('Change eval.md status with the Edit tool, not the shell, so the gate can check it.');

  if (evalMatch && EDIT_TOOLS.includes(tool)) {
    const next = tool === 'Write' ? ti.content : tool === 'Edit' ? ti.new_string
      : tool === 'MultiEdit' ? (ti.edits || []).map((e) => e.new_string).join('\n') : '';
    const target = ((next || '').match(/^status:\s*([\w-]+)/m) || [])[1];
    const cur = fs.existsSync(file) ? parseEval(fs.readFileSync(file, 'utf8')).fm.status : null;
    const dir = path.dirname(file);
    if (target === 'done') {
      const text = tool === 'Write' ? ti.content : fs.readFileSync(file, 'utf8');
      const r = evaluate(text, { results: true, lint: true, dir });
      if (!r.ok) deny(`Cannot mark ${evalMatch[1]} done. The eval gate fails:\n - ${r.problems.join('\n - ')}\nGet every check to PASS with evidence first.`);
    } else if (target === 'building' && !['reviewed', 'building'].includes(cur)) {
      deny(`Cannot start building ${evalMatch[1]}: status is "${cur}". The user must review the evals first (status reviewed).`);
    } else if (target === 'reviewed' && cur !== 'reviewed') {
      ask(`Mark ${evalMatch[1]} as reviewed? Only approve if you have read the eval.md and mockup and they are right.`);
    }
  }
} catch (e) {
  console.error('solo-review guard error (not blocking):', e.message);
  process.exit(1);
}
process.exit(0);
