---
name: setup-review
description: One-time setup of the solo review system in a project. Creates REVIEW.md, links it from CLAUDE.md, makes the specs/ folder, and sets the git rules. Use when the user says "set up review", "install the review system", or starts using solo-review in a new project.
disable-model-invocation: true
---

Set up the solo review system in the current project. Do these steps in order. Report each one.

1. **Git.** Run `git rev-parse --is-inside-work-tree`. If it is not a repo, run `git init` and tell the user. Features get their own branch and every working version is saved, so a bad change can be rolled back.
2. **Folders.** Create `specs/` and `.review/evidence/`. Add `.review/` to `.gitignore` (create the file if missing).
3. **REVIEW.md.** If `REVIEW.md` does not exist, copy `${CLAUDE_PLUGIN_ROOT}/templates/REVIEW.md` to the project root. Then fill it in from the project itself:
   - §4 commands: read `package.json` scripts (or `Makefile`, `pyproject.toml`) and write the real install, lint, test, build and start commands. If a command does not exist, write `none` and tell the user.
   - §1 and §3: add 1 to 3 lines that fit this app (look at the README and top-level folders; do not read the whole codebase).
   - §5: add build folders and lock files that exist here.
   Leave §7 as it is. Never overwrite an existing REVIEW.md: show the user what you would add instead.
4. **CLAUDE.md.** Create it if missing. Add this block once (check first so it is not added twice):

   ```
   @REVIEW.md

   ## Review workflow
   - For a new feature, run /solo-review:write-evals first. Do not build before the user approves the evals.
   - Work on a git branch per feature: feature/<fr-nn-name>. Commit every version that works.
   - Rate risk with /solo-review:risk-level before writing evals.
   - Build with /solo-review:review-loop FR-NN. Never mark a feature done unless its eval gate passes.
   - A bug report: use /solo-review:fix-a-bug.
   ```
5. **Check the hooks.** Run `node "${CLAUDE_PLUGIN_ROOT}/hooks/selfcheck.mjs"`. It must print `OK`.
6. **Browser tools.** Check that Chrome DevTools MCP tools are available (search for `mcp__chrome-devtools__`). If not, tell the user the verifier and first-time-user agents need it, and how to add it.
7. **Finish.** Tell the user the next step: describe a feature, then run `/solo-review:write-evals`.

Do not write app code in this skill.
