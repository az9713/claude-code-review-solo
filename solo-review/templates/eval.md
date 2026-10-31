---
feature: {{feature-folder-name}}
risk: {{low|medium|high}}
status: draft
---
# Evals: {{FR-NN title}}

How to read this file
- An eval is a fixed check. Each one has a "how" that an agent can run and an "expect" that can be seen.
- Every result starts as PENDING. Only the verifier writes PASS or FAIL, with one line of evidence.
- status moves: draft -> in-review -> reviewed -> building -> done. You (the user) approve "reviewed".
- Needed checks by risk. low: 3 in total. medium: 5 in total. high: 8 in total, with 2 fail and 2 regression.
  Each level needs at least 1 use, 1 fail and 1 regression check.

## Ways to use the feature
### EV-01 {{title: a normal use}}
- type: use
- how: {{numbered steps with exact inputs, for example: 1. open http://localhost:PORT 2. type "Buy milk" 3. press Add}}
- expect: {{what must be visible or true afterwards}}
- result: PENDING
- evidence:

## Ways it can fail
### EV-02 {{title: bad or empty input, network error, double click, very long text}}
- type: fail
- how: {{steps}}
- expect: {{a clear error or a safe refusal, and no lost data}}
- result: PENDING
- evidence:

## Features this must not break
### EV-03 {{title: an older feature that shares code or data with this one}}
- type: regression
- how: {{steps}}
- expect: {{the older feature still behaves as before}}
- result: PENDING
- evidence:

## Design (only when mockup.html exists)
### EV-04 {{title: matches mockup.html}}
- type: design
- how: Take a screenshot at 1280 px and at 390 px width. Compare each with mockup.html at the same width. List every visible difference.
- expect: Layout, text, colours and states match the mockup. Differences are named and small.
- result: PENDING
- evidence:
