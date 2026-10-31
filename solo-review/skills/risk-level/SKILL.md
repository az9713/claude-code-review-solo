---
name: risk-level
description: Rates a feature low, medium or high risk before it is built. Use before write-evals, or when the user asks "how risky is this feature", "how careful should I be", or "how strict should the review be".
---

Rate the feature with one question: **What happens to a customer if this feature breaks?**

| Level | A failure means | Examples | Review effort |
| --- | --- | --- | --- |
| **low** | Something looks wrong. Nothing is lost. | Text, colours, spacing, an internal page, a change behind a flag | 3 checks. Light review. |
| **medium** | A feature does not work, but nobody loses anything and it can be fixed later. | A new form, a filter, a list, most normal features | 5 checks. Normal review. |
| **high** | A person loses money or data, is locked out, or sees another person's data. It cannot be undone. | Payments, login, permissions, delete, export, data migration, anything that sends emails or messages | 8 checks, with 2 fail and 2 regression checks. Deep review. Always read the result yourself. |

## Steps
1. Read the feature's `specs/<id>/RD.md`, or the user's description.
2. Pick the level. When two levels fit, pick the higher one. A feature that deletes or sends is at least medium.
3. Say the level and the reason in one or two sentences, as the answer to the question above.
4. If `specs/<id>/eval.md` exists, set its `risk:` line with the Edit tool. If it does not exist yet, pass the level to `/solo-review:write-evals`.

Higher risk costs more tokens and time, so do not rate everything high. A solo project often has one or two high-risk features.
