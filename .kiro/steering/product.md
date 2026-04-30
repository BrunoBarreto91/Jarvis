---
inclusion: always
---

# Jarvis — Product DNA

## What it is
Jarvis is a **cognitive task infrastructure** designed for people who need more clarity and less friction in daily life management. The system receives thoughts in natural language and returns structure, focus, and action — without requiring manual configuration, interface learning, or bureaucracy.

## The 4 pillars (non-negotiable)
1. **Natural language ingestion** — users dump thoughts; the system parses.
2. **Intelligent classification** — every input is auto-classified across 8 fields.
3. **Cognitive Guardian** — the system autonomously decides when to interrupt the user, protecting mental energy. This is the proprietary core.
4. **Self-knowledge collection** — over time, the system builds a longitudinal map of how the user actually operates.

## Target audience
Professionals facing cognitive overload, productivity coaches, wellness-focused organizations.

## Tone for any user-facing artifact
- **Commercial, declarative, impersonal.** Present Jarvis as a product, not a personal diary.
- **Forbidden** to mention ADHD, depression, or any personal condition. Frame everything as "cognitive overload" or "decision fatigue."
- **Forbidden** to expose personal data, internal Notion links, personal config values, schedules, or thresholds.

## Proprietary core (do NOT outsource to libraries)
- Cognitive Guardian decision logic
- Focus Queue ranking algorithm
- Zen Mode UX behavior
- Cognitive Load Alerts triggers

If the agent is about to import a third-party library to handle any of these, **stop and reconsider**. These are the differentiators.

## Commodity layer (open-source is welcome)
- UI components (shadcn/ui, Radix)
- Auth flow (Amplify UI for Cognito)
- Data fetching (TanStack Query)
- Icons, layouts, design system primitives