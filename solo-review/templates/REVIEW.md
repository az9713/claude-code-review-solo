# REVIEW.md: how to review this app

One file. It tells every agent how to review this project. CLAUDE.md links to it with `@REVIEW.md`.
Keep it short. Replace each {{placeholder}}. Delete a line that does not apply.

## 1. What counts as a real failure
A review finding is real only if a user of the app can see harm. In this app, failure looks like:
- {{Data is lost, wrong, or shown to the wrong person.}}
- {{A feature in the RD does not work, or works only for the happy path.}}
- {{The app crashes, hangs, or shows a blank screen.}}
- {{The UI differs from mockup.html in a way a user would notice.}}
- {{Add one line that is specific to this app. Example for docs: "it lies". For config: "it misroutes".}}

## 2. How serious each kind of problem is
- **Blocker**: data loss, security hole, a feature that does not work, a crash. The loop cannot finish with one open.
- **Major**: wrong behaviour in a normal use, or a missing error case that the eval lists. The loop cannot finish with one open.
- **Minor**: small visual or wording difference. Report it. It does not hold the loop. Cap: 3 per review.
- **Pre-existing**: the problem was in the code before this change. Label it. Do not fix it in this loop.

## 3. Review checklist (the reviewer reads the diff against this)
- Does the change do what the RD says, and nothing more?
- Is every input checked at the place where it enters (form, API body, URL, file)?
- Does every failure give a clear message and leave the data safe?
- Are there new paths with no test? (The builder must add e2e paths for each new eval path.)
- Could the change break a feature that shares its code or data?
- Is there a secret, a token, or a personal detail in the code or the logs?
- Was a test weakened, skipped or deleted?
- {{Add checks that are specific to this app.}}

## 4. How to test this app
- Install: `{{npm install}}`
- Lint: `{{npm run lint}}`
- Unit and e2e tests: `{{npm test}}`
- Production build: `{{npm run build}}`
- Start (production): `{{npm start}}` on a free port, with a throwaway data store. Never use real data.
- Use the app in a browser with the Chrome DevTools MCP tools (`mcp__chrome-devtools__*`):
  `new_page`, `navigate_page`, `take_snapshot` (to find elements), `click`, `fill`, `take_screenshot`, `resize_page` (use 1280 and 390 wide), `list_console_messages`.
- Save screenshots in `.review/evidence/` and name the file in the eval's evidence line.
- Stop only the server process you started. Use the PID you captured. Never kill by name.

## 5. What to ignore
- Formatting and style that the linter already checks.
- Files in: {{dist/, build/, node_modules/, *.lock, generated files}}
- Naming preferences, and "could be refactored" remarks.
- A problem that is outside the diff (label it Pre-existing instead).
- {{Add things the reviewer keeps flagging that are not real problems.}}

## 6. How to report
- Start with a count: `Findings: 2 Blocker, 1 Major, 0 Minor` (or `Findings: none. Nothing to fix.`).
- One finding per item, in this form:
  `F? | Blocker/Major/Minor | class: <kind of problem> | file:line | what a user sees | evidence`
- Give a file and a line as evidence. Do not guess from a name.
- Name the **class** of problem. The builder then fixes every instance of that class, not one line.
- Do not repeat a finding that was already reported.

## 7. Rules learned over time
Add a one-line rule when a review misses a bug that shows up later, or keeps flagging something that is not a real problem.
Only add a rule after the user says yes.

- (none yet)
