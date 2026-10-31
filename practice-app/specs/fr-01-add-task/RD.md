# FR-01: Add a task

## Why
A person needs to write down things to do. Today the page only lists one fixed task.

## Requirements
1. The page has a text field and an "Add" button.
2. Pressing Add with text adds the task to the top of the list, and the field clears.
3. A task title is 1 to 100 characters after trimming spaces. Otherwise the app shows a clear error and adds nothing.
4. Added tasks are still there after a page reload (they live in the server's memory).
5. The page works on a phone-width screen (390 px).

## Out of scope
- Editing or deleting a task. Users and login.
