---
inclusion: always
---

# Jarvis — Canonical Tech Stack

## Frontend
- **Framework:** React + Vite
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui (copy-paste, owned by repo)
- **Auth:** Amplify UI for AWS Cognito
- **Data fetching:** TanStack Query
- **State:** local component state by default; Zustand only when justified

## Backend
- **Orchestration:** n8n (3 flows: ingestion, classification, guardian)
- **LLM:** Google Gemini
- **Database:** MySQL on AWS RDS
- **Auth:** AWS Cognito
- **Containerization:** Docker
- **API style:** REST, JSON, JWT-authenticated

## Infrastructure
- **Hosting:** AWS Amplify (frontend), EC2 (n8n)
- **Region:** us-east-1
- **CI/CD:** Amplify / Kiro

## Language and conventions
- **All code, comments, commit messages, and documentation: EN-US.**
- **Commit style:** Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).
- **Testing:** Vitest for frontend; Jest or pytest for any future Python utility.
- **Linting:** ESLint + Prettier on JS/TS; SQL formatted with `pg_format` style.

## Forbidden choices (without ADR)
- Switching frontend framework (Next.js, Remix, etc.)
- Replacing n8n with another orchestrator
- Adding new database engines
- Bringing in cognitive memory libraries (e.g., MemPalace) for the proprietary core

Any deviation requires an ADR in `docs/adr/`.