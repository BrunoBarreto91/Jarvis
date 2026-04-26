---
inclusion: fileMatch
fileMatchPattern: ["README.md", "docs/**/*.md"]
---

# Editorial Rules — Public Artifacts

These rules apply to every artifact intended for public consumption: `README.md`, anything under `docs/`, the public website, and any deck or PDF derived from this repository.

## Forbidden content
- Personal data beyond "Bruno Barreto": phone, address, personal email.
- Personal medical or psychological conditions: ADHD, depression, anxiety, medication, therapy.
- Internal Notion links of any form (`notion.so/...`, `notion://...`).
- Personal configuration values: weights, thresholds, schedules, focus windows, cooldown minutes.
- Numbers tied to personal use ("I run this at 9 AM", "my urgency cutoff is 4").
- First-person personal narratives that frame the project as a diary or self-help journey.

## Required content
- **Language:** EN-US, professional, technically accessible.
- **Tone:** declarative, impersonal, commercial. The reader should perceive Jarvis as a configurable product, not a personal experiment.
- **Audience framing:** "users facing cognitive overload", "professionals with high decision load" — never specific personal conditions.
- **Code blocks:** always language-tagged.
- **Diagrams in `README.md`:** ASCII (mobile-friendly on GitHub).
- **Diagrams in `docs/architecture.md`:** Mermaid.
- **Claims must be backed.** No marketing fluff. Every benefit statement must be tied to a concrete architectural choice, benchmark, or feature.

## Authorship line
Always exactly: `Bruno Barreto — github.com/BrunoBarreto91`. Nothing more.

## Cross-references
- For sanitization, refer to `sanitization-checklist.md` in this Power.
- For wording guidance, refer to `tone-examples.md` in this Power.
- For architectural decisions affecting public docs, see `docs/adr/`.