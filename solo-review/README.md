# solo-review

A code-review system for one person who uses agents to build. It follows the Anthropic article "How the Claude Code team does code review" and the AI Labs video, with the team layers (pull requests, approval tiers, merge queue) removed.

Full teaching guide: `../docs/index.html`. Practice project: `../practice-app/`.

## Install
Try it for one session:
```
claude --plugin-dir "<project-folder>\solo-review"
```
Keep it:
```
claude plugin marketplace add "<project-folder>"
claude plugin install solo-review@solo-review-local
```
Needs: Node 18 or later (hooks), git, and the Chrome DevTools MCP server (verifier and first-time-user agents).

## Commands
| Command | Use |
| --- | --- |
| `/solo-review:setup-review` | Once per project. Makes REVIEW.md, links it in CLAUDE.md, makes `specs/`. |
| `/solo-review:risk-level` | Rate a feature low, medium or high. |
| `/solo-review:write-evals` | New feature: writes `eval.md` and a mockup, then waits for your yes. Never builds. |
| `/solo-review:review-loop FR-NN` | Builds and checks in rounds until every eval passes (max 5 rounds). |
| `/solo-review:first-time-user <goal>` | A fresh agent uses the live app like a new customer. |
| `/solo-review:fix-a-bug <problem>` | Reproduce, find the cause, fix with a regression test. |

## Parts
- `skills/`: the six commands above.
- `agents/`: `builder`, `verifier`, `reviewer`, `first-time-user`. Each loop round starts new ones.
- `hooks/guard.mjs`: runs before every tool call. It does nothing in a project without a `specs/` folder. It blocks:
  - `status: done` unless every check in `eval.md` is PASS with evidence;
  - `status: building` unless the status is `reviewed`; `reviewed` asks you to confirm;
  - builder edits to `eval.md`, and verifier edits to app code;
  - the first-time-user agent from using anything except browser tools.
- `hooks/eval-gate.mjs`: the gate as a command: `check`, `lint`, `reset`, `status`.
- `hooks/selfcheck.mjs`: `node hooks/selfcheck.mjs` must print `OK`.
- `templates/`: `eval.md`, `RD.md`, `REVIEW.md`, `state.md`.

## Known limits
- A hook sees tool calls, not intent. A shell command that edits `eval.md` in an unusual way could pass. The guard blocks the common `status:` forms.
- The first-time-user block uses the hook field `agent_type`. The agent's own `tools:` list is the second layer. Run the practice exercise once to confirm both work on your machine.
