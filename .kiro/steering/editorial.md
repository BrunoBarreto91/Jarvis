---
inclusion: fileMatch
fileMatchPattern: ["README.md", "docs/**/*.md"]
---

# Editorial Guardrails — Public-facing Documentation

These rules apply to every public artifact: `README.md`, anything under `docs/`, deck materials, public site copy.

## Forbidden
- Personal data: full name beyond "Bruno Barreto", phone, address, personal email
- Personal conditions: ADHD, depression, mental health diagnoses, medication, therapy
- Internal Notion links (`notion.so/...`)
- Personal config values: weights, thresholds, schedules, times of day
- Numbers tied to personal use (e.g., "I run this 3x a day")
- First-person personal narrative ("I built this because...")

## Required
- **Language:** EN-US, professional, technically accessible
- **Tone:** declarative, impersonal, commercial
- **Framing:** present Jarvis as a configurable product for an audience, not a diary
- **Diagrams in README:** ASCII (mobile-friendly on GitHub)
- **Diagrams in `docs/architecture.md`:** Mermaid
- **Code blocks:** language-tagged
- **No marketing fluff:** every claim must be backed by something concrete (architecture, benchmark, screenshot)

## Pre-commit checklist (run mentally before any PR touching these files)
- [ ] No personal data exposed
- [ ] No mention of personal conditions
- [ ] No internal Notion links
- [ ] No personal config values
- [ ] All in EN-US
- [ ] Tone is impersonal and declarative
- [ ] Examples generic enough to apply to any user

## Examples — bad → good

| Bad |				 Good |
|-----|				------|
| "I built this because of my ADHD" | "Built for users facing cognitive overload" |
| "Runs at 9 AM every day for me" | "Runs on a configurable schedule" |
| "My weight for urgency is 0.7" | "Urgency weight is configurable per deployment" |
| "See my Notion page for details" | "See `docs/architecture.md` for details" |