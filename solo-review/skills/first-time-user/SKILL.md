---
name: first-time-user
description: Starts the app and sends a fresh agent that has never seen it to use it like a first-time customer, then lists every place that person got stuck. Use after a feature passes its evals, or when the user says "test it like a new user" or "where would a new user get stuck".
disable-model-invocation: true
argument-hint: <what a new user is trying to do, in plain words>
---

Run a first-time-user test. The agent must not learn anything about the app from the code or the docs. You (the orchestrator) know the code, so be careful what you pass on.

1. **Goal.** Take the goal from `$ARGUMENTS`. If empty, ask the user what a new person would try to do (one sentence, in the words of a customer). Write the goal as a person would say it, with no code names, no file names, no feature IDs, no hints about the UI. Example: "Write down a thing you need to do today, and then mark it as done."
2. **Start the app with throwaway data.** Use the production start command from `REVIEW.md` §4 on a free port. Point it to a temporary data store, never the real one (a temp folder, an in-memory store, or a copy). Find how the app chooses its data store from `package.json` scripts and env files. If you cannot tell, ask the user before you start. Run it in the background with Bash and capture the PID. Wait until the URL answers.
3. **Spawn the agent.** Start the `first-time-user` subagent. Give it only: the URL and the goal. Nothing else. A hook blocks it from reading files, running commands or using any tool except the browser tools. Wait until it finishes.
4. **Stop the app.** Stop the server with the PID you captured. Never kill by name. Delete the temporary data.
5. **Save and report.** Save the agent's report to `.review/ftu/<date>-<feature>.md`. Show the user:
   - whether the goal was reached,
   - each stuck point, ordered Blocked, then Confused, then Slow,
   - for each one, a suggested fix in one line (you may read the code now to suggest it).
   Do not apply the fixes. Ask which ones the user wants. A confirmed fix goes through `/solo-review:write-evals` (new check) or `/solo-review:fix-a-bug`.

If the agent reports that a tool was blocked, that is the hook working. If it reports it could not even load the page, check the app and the URL, and run it again once.
