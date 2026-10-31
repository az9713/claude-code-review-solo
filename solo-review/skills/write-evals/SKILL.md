---
name: write-evals
description: Turns a feature into an eval.md (checks an agent can run) and an HTML mockup, then asks the user to review them before anything is built. Use whenever the user brings a new feature to build, or says "write evals", "spec this feature", or "what should we check for this feature". This skill only writes the evals. It never builds the feature.
---

You write the evals for one feature. You do **not** build the feature. Not one line of app code.

Arguments: the feature (a name, an FR-NN id, or a description) and optionally `risk=low|medium|high`.

## Steps
1. **Find or make the folder.** Features live in `specs/fr-NN-short-name/`. Take the next free NN. If the folder has no `RD.md`, make it from `${CLAUDE_PLUGIN_ROOT}/templates/RD.md` using what the user told you. If the requirements are vague, ask the user at most 3 short questions first.
2. **Risk.** If no risk was given, run the `risk-level` skill. The risk sets how strict the evals are.
3. **Write `eval.md`** from `${CLAUDE_PLUGIN_ROOT}/templates/eval.md`. Each check has `type`, `how`, `expect`, `result: PENDING`, `evidence:` (empty). Make the checks cover three things:
   - **All the ways to use the feature**: normal use, each option, each screen, mobile and desktop.
   - **All the ways it can fail**: empty, wrong or very long input, repeated clicks, errors from the server, no data, a reload in the middle.
   - **Features this one must not break**: read the existing `specs/` and the code layout, and list the older features that share code or data.
   A `how` must be steps an agent can run with exact inputs and a URL pattern. A `expect` must be something that can be seen or measured. "Works well" is not a check.
4. **Mockup (UI features only).** Write `mockup.html` in the same folder: one self-contained file, no build step. Show every state the screen can have (empty, filled, error, loading) and show it at desktop width and at 390 px width. Then add one `type: design` check that compares the live app with it.
5. **Lint it.** Run `node "${CLAUDE_PLUGIN_ROOT}/hooks/eval-gate.mjs" lint <id>`. Fix every problem it lists. Do not continue until it says `GATE: PASS`.
6. **Hand over for review.** Set `status: in-review` in `eval.md` (Edit tool). Tell the user:
   - the decisions you made on your own (each in one line),
   - the paths of `RD.md`, `eval.md`, `mockup.html` (open the mockup for them if you can),
   - that **nothing will be built until they say yes**.
   Then ask them to review both the eval and the mockup.
7. **On changes:** edit the files and repeat from step 5.
8. **On an explicit yes:** set `status: reviewed` (Edit tool). A hook will ask the user to confirm: that is expected. Then tell them to run `/solo-review:review-loop <FR-NN>` to build.

Never set `reviewed` without a clear yes from the user in this conversation. Never build. Never write PASS or FAIL: only the verifier does that.
