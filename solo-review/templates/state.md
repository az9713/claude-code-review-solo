---
feature: {{feature-folder-name}}
risk: {{low|medium|high}}
round: 0
max_rounds: 5
base_commit: {{git sha before round 1}}
last_commit: {{git sha after the latest round}}
---
# Review loop state

## Findings ledger
IDs stay the same across rounds. "class" is the kind of problem (for example: missing input check, wrong status code).
fix_rounds = rounds in which a fix for this finding was tried and it was still open afterwards.

| ID | source | class | summary (file:line) | first_round | last_seen | fix_rounds | status |
| --- | --- | --- | --- | --- | --- | --- | --- |

## Round log
| round | gate result | open findings | note |
| --- | --- | --- | --- |
