---
inclusion: always
---

# Jarvis — Repository Structure

## Canonical layout

Jarvis/
├── .kiro/                      # Kiro IDE config (steering, specs, hooks, powers)
├── client/                     # React + Vite frontend
│   ├── src/
│   ├── public/
│   └── package.json
├── server/                     # API layer (if/when added)
├── docs/
│   ├── architecture.md         # HLD/MLD/LLD diagrams (Mermaid)
│   ├── guardian-agent.md       # Cognitive Guardian spec
│   ├── api-reference.md        # All endpoints
│   └── adr/                    # Architecture Decision Records
├── sql/
│   └── schema.sql              # Canonical schema (no seeds with real data)
├── workflow/
│   └── jarvis_workflow.json    # n8n workflow export (sanitized)
├── .gitignore
├── .kiroignore
├── LICENSE                     # MIT
├── README.md                   # English, portfolio-grade
└── package.json

## Rules
- **Do not introduce top-level directories** without an ADR.
- **Do not relocate** `docs/`, `sql/`, or `workflow/` — external references depend on these paths.
- **Do not commit** `.env`, `*.pem`, `sql/seed_*.sql`, or any file with real credentials. The `.kiroignore` and `.gitignore` already enforce this.
- **Do commit** `.env.example` with placeholder values for every required env var.

## When in doubt
If the agent is about to create a file outside this structure, ask the user first. Do not guess.