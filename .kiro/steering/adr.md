---
inclusion: manual
---

# ADR Template — Architecture Decision Record

> Trigger this steering with `#adr` in the chat when proposing or documenting an architectural decision.

## When to write an ADR
Write an ADR whenever the agent (or you) is about to:
- Choose a framework, library, or service
- Change the canonical structure of the repo
- Modify the proprietary core (Guardian, Focus Queue, Zen Mode, Cognitive Load Alerts)
- Replace or remove an existing technical choice
- Introduce a cross-cutting pattern (auth, error handling, logging)

## Filename convention
`docs/adr/ADR-NNN-short-kebab-title.md`

NNN is zero-padded sequence (`001`, `002`, ...). Never reuse a number.

## Template (copy verbatim)

ADR-NNN — [Short title in imperative]
Status: [Proposed | Accepted | Superseded by ADR-XXX | Rejected]
Date: YYYY-MM-DD
Decider: Bruno Barreto
Consulted: [agents/people consulted, if any]

Context
What is the situation? What forces are at play? Keep it factual, no opinion yet.

Decision
The decision, stated clearly in one or two sentences. Use active voice.

Rationale
Why this decision? What alternatives were considered and rejected?

Option
| Option | Pros | Cons | Outcome |
| --- | --- | --- | --- |
| A | ... | ... | Chosen / Rejected |
| B | ... | ... | Rejected because... |

Consequences
What becomes easier? What becomes harder? What are the second-order effects?
    Positive: ...
    Negative: ...
    Neutral: ...

Implementation notes
Any concrete steps, file changes, or migration plan.

References
    Related ADRs
    External docs or RFCs
    Notion pages (only in this private record, not in public artifacts)

## Rules
- ADRs are **append-only**. Never edit an accepted ADR — supersede it with a new one.
- Each ADR maps to a single decision. Do not bundle multiple decisions.
- Keep ADRs concise (under 200 lines). If longer, split.