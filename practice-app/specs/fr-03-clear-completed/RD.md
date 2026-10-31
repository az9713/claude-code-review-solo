# FR-03: Clear completed tasks

## Why
A person wants to remove all finished tasks at once. A mistake here deletes data that cannot be restored.

## Requirements
1. A "Clear completed" button removes every done task from the list and from the server.
2. Open (not done) tasks are never removed.
3. The button asks the person to confirm before it deletes anything, and shows how many tasks it will remove.
4. If there are no completed tasks the button is disabled.

## Out of scope
- Undo. Deleting one task.
