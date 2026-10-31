---
name: fix-a-bug
description: Takes a bug report ("feature X does not work"), reproduces it, finds the real cause, and fixes it with a regression test. Use when the user says something is broken, not working, or regressed, or runs /solo-review:fix-a-bug.
argument-hint: <what is broken>
---

The user says something does not work: `$ARGUMENTS`. First find out if that is true. Then find why. Then fix it. Do not guess a fix.

1. **State the bug.** Write two lines: *Expected:* and *Actual:*. If you cannot tell, ask the user one question.
2. **Reproduce it.** Run the app (production start from `REVIEW.md` §4, throwaway data) and follow the same steps as the user with the browser tools, or run the failing request or test. Save a screenshot or output in `.review/evidence/`.
   - If you **cannot** reproduce it: say so, show what you tried, and ask the user for the exact steps. Stop. Do not change code.
3. **Find the cause.** Write your guess about the cause, then **test the guess**: add a log, run a narrower test, or write a failing test that shows the cause. Use git to find the change: `git log --oneline -- <path>`, `git log -S"<text>"`, and `git bisect` (or checking out earlier commits) to find the last version that worked. Repeat until the test proves the cause. Say the cause in plain words, with `file:line`.
4. **Fix it.** Make the smallest change that removes the cause. Work on a branch `fix/<short-name>`. Keep the failing test: it now passes and stays as a regression test.
5. **Check.** Run lint, tests and build from `REVIEW.md` §4. Re-run the steps from step 2 and confirm the bug is gone. Check the features that share the changed code.
6. **Lock it in.** If the bug belongs to a feature in `specs/`, add a `type: regression` check for it to that feature's `eval.md` (new `### EV-NN` block, `result: PENDING`) and tell the user to run the verifier through `/solo-review:review-loop <FR-NN>` when they want it confirmed. Commit with a message that names the cause.
7. **Learn.** If the review loop could have caught this and did not, propose one line for `REVIEW.md` §7 and add it only if the user says yes.
8. **Report:** the cause, the fix, the evidence, and how to undo it (`git revert <sha>`).
