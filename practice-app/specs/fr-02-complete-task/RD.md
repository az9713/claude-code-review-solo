# FR-02: Complete a task

## Why
A person needs to tick off finished tasks and still see what they finished.

## Requirements
1. Each task has a checkbox. Ticking it marks the task done and shows its title struck through.
2. Unticking it makes the task open again.
3. The state is kept on the server and is still there after a reload.
4. Ticking a task that does not exist (for example a stale page) shows an error and does not break the list.

## Out of scope
- Editing or deleting a task. Sorting.
