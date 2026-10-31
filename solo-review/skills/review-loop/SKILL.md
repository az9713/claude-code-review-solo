---
name: review-loop
description: Builds a reviewed feature and checks it in rounds with fresh-context subagents (builder, verifier, reviewer) until every eval passes. Use when the user runs /solo-review:review-loop FR-NN or says "build and review this feature". The feature must already have approved evals (status reviewed).
disable-model-invocation: true
argument-hint: FR-NN
---

You are the **orchestrator** of the review loop for feature `$ARGUMENTS`. You run the loop. You **never write or judge app code yourself**. Builder, verifier and reviewer are subagents. Each round starts brand-new ones, so each begins with a fresh context and cannot just agree with you.

`GATE` below means: `node "${CLAUDE_PLUGIN_ROOT}/hooks/eval-gate.mjs"`.

## Before round 1
1. Find the folder `specs/<id>/`. Run `GATE lint <id>`. It must pass.
2. Run `GATE status <id>`. If it is not `reviewed` (or `building`, when resuming), stop. Tell the user to finish `/solo-review:write-evals` and approve the evals.
3. Git: if the working tree has uncommitted changes, ask the user what to do. Create or switch to branch `feature/<folder-name>`. Record `git rev-parse HEAD` as `base_commit`.
4. Create `.review/state.md` from `${CLAUDE_PLUGIN_ROOT}/templates/state.md` (feature, risk from eval.md, round 0, max_rounds 5, base_commit).
5. Set `status: building` in `eval.md` (Edit tool).

## Each round N (1 to 5)
1. **Build.** Start the `builder` subagent with: the folder, the round number, and the fix list (none in round 1). In round 4 and 5, if the problem was not fixed in rounds 1 to 3, tell it **STEP BACK**: do not patch, change the approach. Give it the root-cause note from the last reviewer. If it returns `DECISION NEEDED`, stop the loop and ask the user (see Stop rules).
2. **Diff.** Run `git diff <previous commit>..HEAD > .review/diff-round<N>.patch`. Previous commit is `base_commit` in round 1 and `last_commit` after. Update `last_commit` in `state.md`.
3. **Verify and review, in parallel** (two subagent calls in one message):
   - `verifier`: the folder and the round number. In round 2 or later, also give it the open findings to re-check after its own pass.
   - `reviewer`: the folder, the round, the diff path, and the findings already reported (ID and summary). Round 1 reviews the whole diff. Later rounds review only the new diff. In STEP BACK mode (round 4 and 5), ask for a root-cause note only.
   Do **not** give either one the builder's summary.
4. **Triage (you do this).**
   - Run `GATE check <id> --lint` yourself. **The gate result counts, not the verifier's words.** Each FAIL or PENDING check becomes a finding with the ID of the check (EV-NN).
   - Take the reviewer's findings. Drop every one that matches `REVIEW.md` §5 (the ignore list) and every `Pre-existing` or `Minor` one (list those at the end, they do not hold the loop).
   - Merge duplicates. Give each finding an ID `F-01`, `F-02`... that **stays the same across rounds**: if a finding has the same class and file as one in the ledger, it is the same finding.
   - Update the ledger and round log in `.review/state.md`.
   - Write the **fix list** for the next build: ID, class, `file:line`, what a user sees. State the class so the builder fixes all instances.
5. **Decide.**
   - Gate passes **and** no open Blocker or Major finding: go to **Finish**.
   - Otherwise go to round N+1, unless a Stop rule applies.

## Stop rules (the loop must end)
Stop and tell the user (see Report) when any of these is true:
- **Round cap:** round 5 ended and the work is not done.
- **No progress:** one finding or one check is still open after 2 rounds of fixes for it.
- **Decision needed:** the builder returned `DECISION NEEDED`, or the fix needs a product choice. Ask the user the question with the options, and resume with their answer.
- **The gate cannot run** (for example the app does not build for 2 rounds in a row).

Why: an agent author and an agent reviewer can keep each other busy for 50 rounds, and each round uses your plan limits. In Anthropic's data, about 59% of what the reviewer flagged had been in the code since round 1.

## Finish
1. Set `status: done` in `eval.md` with the Edit tool. A hook runs the gate again and blocks it if anything fails. If it blocks, read the reason and go back to the loop.
2. Commit any uncommitted app changes: `git add -A && git commit -m "<id>: done"`. `.review/` is in `.gitignore`, so state and evidence stay untracked.
3. **Learned rules.** Look at the ledger. For a finding that came back in 2 or more rounds, or a dropped finding that was noise, write a one-line rule for `REVIEW.md` §7. Show the proposed lines to the user. Add them only if the user says yes.
4. Report: rounds used, final gate output, the Minor and Pre-existing findings you did not fix, the proposed rules, and the branch name. Suggest `/solo-review:first-time-user` for the live app.

## Report when stopped
Give a progress report: current round, gate output, the open findings from the ledger, what was tried, and your question for the user. Leave `status: building`. Never mark the feature done.
