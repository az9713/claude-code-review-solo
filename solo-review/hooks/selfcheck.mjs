// Self-check for the gate and the guard. Run: node hooks/selfcheck.mjs  (prints OK or throws)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'solo-review-'));
const dir = path.join(tmp, 'specs', 'fr-01-demo');
fs.mkdirSync(dir, { recursive: true });
const evalFile = path.join(dir, 'eval.md');

const mk = (status, results) => `---
feature: fr-01-demo
risk: low
status: ${status}
---
### EV-01 use
- type: use
- how: open the page and add a task
- expect: the task appears
- result: ${results[0]}
- evidence: ${results[0] === 'PASS' ? 'screenshot .review/evidence/ev01.png' : ''}
### EV-02 fail
- type: fail
- how: add an empty task
- expect: an error shows
- result: ${results[1]}
- evidence: ${results[1] === 'PASS' ? 'screenshot .review/evidence/ev02.png' : ''}
### EV-03 regression
- type: regression
- how: reload the page
- expect: the list is unchanged
- result: ${results[2]}
- evidence: ${results[2] === 'PASS' ? 'screenshot .review/evidence/ev03.png' : ''}
`;

const gate = (...a) => spawnSync('node', [path.join(here, 'eval-gate.mjs'), ...a], { cwd: tmp, encoding: 'utf8' });
const guard = (o) => spawnSync('node', [path.join(here, 'guard.mjs')], { input: JSON.stringify({ cwd: tmp, ...o }), encoding: 'utf8' });
const edit = (s, extra = {}) => ({ tool_name: 'Edit', tool_input: { file_path: evalFile, new_string: `status: ${s}` }, ...extra });

// gate
fs.writeFileSync(evalFile, mk('building', ['PASS', 'FAIL', 'PASS']));
assert.equal(gate('check', 'FR-01', '--lint').status, 1, 'a FAIL result fails the gate');
fs.writeFileSync(evalFile, mk('building', ['PASS', 'PASS', 'PASS']));
assert.equal(gate('check', 'FR-01', '--lint').status, 0, 'all PASS passes the gate');
fs.writeFileSync(evalFile, mk('draft', ['PENDING', 'PENDING', 'PENDING']));
assert.equal(gate('lint', 'FR-01').status, 0, 'lint ignores PENDING results');
assert.equal(gate('check', 'FR-01').status, 1, 'PENDING fails check');
fs.writeFileSync(evalFile, mk('draft', ['PASS', 'PASS', 'PASS']));
gate('reset', 'FR-01');
assert.match(fs.readFileSync(evalFile, 'utf8'), /result: PENDING/, 'reset clears results');

// guard: done needs every check PASS
fs.writeFileSync(evalFile, mk('building', ['PASS', 'FAIL', 'PASS']));
assert.equal(guard(edit('done')).status, 2, 'done with a FAIL is blocked');
fs.writeFileSync(evalFile, mk('building', ['PASS', 'PASS', 'PASS']));
assert.equal(guard(edit('done')).status, 0, 'done with all PASS is allowed');

// guard: building needs reviewed first
fs.writeFileSync(evalFile, mk('in-review', ['PENDING', 'PENDING', 'PENDING']));
assert.equal(guard(edit('building')).status, 2, 'building from in-review is blocked');
fs.writeFileSync(evalFile, mk('reviewed', ['PENDING', 'PENDING', 'PENDING']));
assert.equal(guard(edit('building')).status, 0, 'building from reviewed is allowed');

// guard: reviewed asks the user
fs.writeFileSync(evalFile, mk('in-review', ['PENDING', 'PENDING', 'PENDING']));
assert.match(guard(edit('reviewed')).stdout, /"permissionDecision":"ask"/, 'reviewed asks the user');

// guard: roles
const call = (tool, input, agent_type) => guard({ tool_name: tool, tool_input: input, agent_type });
assert.equal(call('Read', { file_path: 'x.js' }, 'first-time-user').status, 2, 'first-time-user cannot Read');
assert.equal(call('Bash', { command: 'cat x.js' }, 'solo-review:first-time-user').status, 2, 'namespaced first-time-user cannot Bash');
assert.equal(call('mcp__chrome-devtools__click', {}, 'first-time-user').status, 0, 'first-time-user can click');
assert.equal(call('mcp__chrome-devtools__evaluate_script', {}, 'first-time-user').status, 2, 'first-time-user cannot run scripts');
assert.equal(call('Read', { file_path: 'x.js' }, 'general-purpose').status, 0, 'other agents unaffected');
assert.equal(call('Edit', { file_path: evalFile, new_string: 'x' }, 'builder').status, 2, 'builder cannot edit eval.md');
assert.equal(call('Edit', { file_path: path.join(tmp, 'src', 'a.js'), new_string: 'x' }, 'verifier').status, 2, 'verifier cannot edit app code');
assert.equal(call('Edit', { file_path: evalFile, new_string: 'x' }, 'verifier').status, 0, 'verifier can edit eval.md');
assert.equal(call('Bash', { command: `sed -i 's/status: draft/status: done/' specs/fr-01-demo/eval.md` }).status, 2, 'shell status change is blocked');

// guard: builder cannot edit code while the loop's feature is still in-review
fs.mkdirSync(path.join(tmp, '.review'), { recursive: true });
fs.writeFileSync(path.join(tmp, '.review', 'state.md'), '---\nfeature: fr-01\n---\n');
fs.writeFileSync(evalFile, mk('in-review', ['PENDING', 'PENDING', 'PENDING']));
assert.equal(call('Edit', { file_path: path.join(tmp, 'src', 'a.js'), new_string: 'x' }, 'builder').status, 2, 'builder blocked before review');
fs.writeFileSync(evalFile, mk('building', ['PENDING', 'PENDING', 'PENDING']));
assert.equal(call('Edit', { file_path: path.join(tmp, 'src', 'a.js'), new_string: 'x' }, 'builder').status, 0, 'builder allowed while building');

// guard: no specs/ folder means no effect
const other = fs.mkdtempSync(path.join(os.tmpdir(), 'solo-review-other-'));
const r = spawnSync('node', [path.join(here, 'guard.mjs')], { input: JSON.stringify({ cwd: other, tool_name: 'Edit', tool_input: { file_path: path.join(other, 'a', 'specs', 'x') } }), encoding: 'utf8' });
assert.equal(r.status, 0, 'a project without specs/ is untouched');

fs.rmSync(tmp, { recursive: true, force: true });
fs.rmSync(other, { recursive: true, force: true });
console.log('OK: gate and guard self-check passed');
