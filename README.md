# claude-code-review-solo

A code-review system for one person who builds with coding agents. It is a Claude Code plugin (`solo-review`), a practice app, and a zero-to-hero guide.

**Live guide: https://az9713.github.io/claude-code-review-solo/**

An agent writes a lot of code, says "done", and misses things that were asked for. This project gives the agent a way to prove each feature works, and makes agents other than the builder judge the proof. It needs no pull requests and no team.

## Sources

This project is an independent implementation of ideas from these sources. It is not affiliated with their authors and it does not redistribute them.

| Source | What it contributed |
| --- | --- |
| Anthropic engineering blog, **"How the Claude Code team does code review"**, by Addy Osmani, Morgan Westlee Lunt and Qing Wang, Oct 15, 2026 (`claude.dev/blog/solving-code-review-at-anthropic/`) | The layered model of review, risk-scaled approval, review that must converge (round cap, diff-only re-review, class of bug, no repeat findings), `REVIEW.md`, and fixing repeat mistakes at the source. |
| Anthropic announcement, **"Bringing Code Review to Claude Code"**, Mar 9, 2026 | The multi-agent Code Review product: agents look for bugs in parallel, other agents verify them, findings are ranked by severity. Used as background and as the contrast for cost. |
| AI Labs video, **"Claude Code says the task is done, but is it?"** (`youtube.com/watch?v=S49gppZl8H0`) | The workflow turned into prompts and skills: write-evals with a mockup, a separate reviewer, `REVIEW.md` linked from `CLAUDE.md`, the builder/verifier/reviewer loop, learned rules, risk levels, the stop rules, the first-time-user test and the fix-a-bug skill. |

## What this project is

`solo-review/` is a Claude Code plugin with:

- **6 skills:** `setup-review`, `risk-level`, `write-evals`, `review-loop`, `first-time-user`, `fix-a-bug`.
- **4 agents:** `builder`, `verifier`, `reviewer`, `first-time-user`. Each loop round starts new ones with a fresh context.
- **1 hook** (`hooks/guard.mjs`) and a gate command (`hooks/eval-gate.mjs`):
  - `status: done` is blocked unless every check in `eval.md` is PASS with evidence.
  - `status: building` is blocked unless the status is `reviewed`, and `reviewed` asks the user to confirm.
  - The builder cannot edit `eval.md`. The verifier can edit only `eval.md` and `.review/`.
  - The first-time-user agent can use browser tools and nothing else.
  - The hook does nothing in a project without a `specs/` folder.
- **Templates** for `eval.md`, `RD.md`, `REVIEW.md` and the loop state.
- A **self-check**: `node solo-review/hooks/selfcheck.mjs` must print `OK`.

`practice-app/` is a tiny task list with three feature specs (add, complete, clear completed). The guide walks through the whole system on it.

`docs/index.html` is the guide. It is published with GitHub Pages.

### How a feature moves

1. `/solo-review:risk-level` rates the feature low, medium or high (3, 5 or 8 required checks).
2. `/solo-review:write-evals` writes `eval.md` and a mockup, then waits. **Nothing is built before the user approves.**
3. `/solo-review:review-loop FR-NN` runs rounds: builder, then verifier and reviewer in parallel, then triage. It stops after 5 rounds, when the same item survives 2 fix rounds, or when a product decision is needed.
4. The feature can be marked done only when the gate passes.
5. `/solo-review:first-time-user` sends an agent that cannot read the code to use the live app. `/solo-review:fix-a-bug` reproduces a bug, tests the guess about its cause, and fixes it with a regression test.

## How this differs from the code review in the sources

| | Anthropic's process (article and product) | This project |
| --- | --- | --- |
| Who it is for | A team that ships a large codebase | One person who directs agents |
| Unit of review | The pull request | The feature, as a folder `specs/<id>/` with `RD.md`, `eval.md`, `mockup.html` |
| When review runs | On every PR, plus before the PR | Before the build (evals are written and approved first), during it (loop), and after (first-time-user, fix-a-bug) |
| What defines "done" | A merged PR with open threads resolved and CI green | `GATE: PASS`: every eval check is PASS with a line of evidence |
| Human approval | 0, 1 or 2 people by risk tier; classifiers pick the tier; a bot never replaces a required person | The user approves the evals (`reviewed`, with a confirmation prompt). Risk sets how strict the evals are, not how many people approve |
| Who reviews | One review agent group per PR; a separate group of agents votes on each finding | Fresh builder, verifier and reviewer agents each round; the main session triages and runs the gate itself |
| Enforcement | CI, branch protection, merge queue | A plugin hook that blocks status changes and limits each agent role |
| Convergence rules | Round cap of 3; diff-only re-review; flag the class; no repeats | Same four ideas, cap of 5 (the video's choice), a findings ledger with stable IDs, and an early stop when an item survives 2 fix rounds |
| Learning | Incidents and reverts form an eval set scored daily | Repeat mistakes become one-line rules in `REVIEW.md` §7 after the user approves them. Each fixed bug adds a regression check |
| Release safety | Merge queue, flags, staged release, on-call | Git branch per feature and a commit per working version |
| Cost | The paid Code Review product averages $15 to $25 per PR (Team and Enterprise plans) | Runs in your own Claude Code session. The cost is the tokens of up to 5 rounds per feature |

### Compared with the AI Labs video

The video shows prompts and the results. Its skills are distributed through a paid community, so the video does not give the files. This repository is a from-scratch build of the same workflow as open files, with these additions:

- The done-gate and the review-before-build rule are a tested script and hook, not only a prompt.
- Agent roles are enforced by the hook (the builder cannot touch `eval.md`; the verifier cannot fix code).
- The first-time-user block has two layers: the agent's tool list and the hook.
- `eval.md` has a fixed format and a lint, with minimum check counts by risk level.
- The guide includes a practice app and a walkthrough where each hook is triggered on purpose.

### What is left out

The team layers: a PR template, risk-tier approval tables, CODEOWNERS, a merge queue, feature-flag rollout and the daily incident-eval scoring. They need a team. The guide's section 10 lists each layer and says whether it is replaced, partly covered or absent.

## Quick start

Needs Node 18 or later, git, Claude Code, and the Chrome DevTools MCP server.

```
claude plugin marketplace add az9713/claude-code-review-solo
claude plugin install solo-review@solo-review-local
```

Then, in a project:

```
/solo-review:setup-review
/solo-review:write-evals <your feature>
```

To try it without installing: clone the repository and run `claude --plugin-dir ./solo-review` inside `practice-app/`. The guide's section 6 is a 45 minute walkthrough.

## Known limits

- The hook was tested with simulated tool calls. No live subagent run is recorded. Whether Claude Code passes `agent_type` to the hook for plugin agents, and whether the `reviewed` confirmation prompt shows in every permission mode, are open until the walkthrough is run. Report results as issues.
- The gate checks the file, not the truth. A weak eval passes the gate. The verifier is a language model, so read the evidence for any feature that matters.
- Anthropic's numbers (merged PRs more than doubled and reverts fell by more than 40%, June to September 2026) come from a team and are not a forecast for one person.
