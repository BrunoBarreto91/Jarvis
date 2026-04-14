# Jarvis — Cognitive Task Infrastructure

> A personal cognitive infrastructure that receives thoughts in natural language and returns structure, focus, and action — without manual configuration, interface learning, or bureaucracy.

![Status](https://img.shields.io/badge/status-backend%20functional-green)
![Stack](https://img.shields.io/badge/stack-n8n%20%7C%20Gemini%20%7C%20MySQL%20%7C%20AWS-blue)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

## The Problem

Traditional productivity tools assume users can consistently organize, prioritize, and execute. In practice, many people face **cognitive overload, decision paralysis, and difficulty with time management**. Tools like Todoist, Trello, and Notion require manual organization that consumes the energy that should go toward execution.

## The Solution

Jarvis is a **REST API-based task management system** powered by AI agents that:

1. **Receives natural language** — "I need to review the AWS budget tomorrow, early" → automatically parsed into 8 structured fields
2. **Classifies intelligently** — title, context, tag, category, priority, energy level, estimated duration, notes
3. **Decides when to interrupt** — the Guardian Agent analyzes urgency, energy, temporal context, and user commands before every notification
4. **Collects self-knowledge** — on task completion, captures real cognitive cost, post-completion sentiment, and actual duration

## Architecture

### High-Level Design

```
┌─────────────────┐     ┌───────────────────────────┐     ┌───────────────┐
│   Frontend      │────▶│  n8n (Docker/AWS)         │────▶│    MySQL      │
│   (React/Vite)  │     │  REST API (Webhooks)      │     │  (tasks DB)   │
└─────────────────┘     │  ├─ Jarvis Agent (Gemini)  │     └───────────────┘
                        │  └─ Guardian Agent (Gemini) │
                        └───────────────────────────┘
                                    │
                            AWS Cognito (JWT)
```

### 3 Independent Flows

The system operates with **3 independent flows** within a single n8n workflow:

| Flow | Trigger | AI Model | Function |
|------|---------|----------|----------|
| **Task Creation** | `POST /tasks` (webhook) | Gemini Flash Lite | Parses natural language → 8 structured fields → MySQL |
| **Task Update** | `PATCH /tasks` (webhook) | — | Updates status + collects cognitive cost, sentiment, real duration |
| **Notification Intelligence** | Schedule (hourly) | Gemini Flash | Analyzes all pending tasks, decides: interrupt or silence |

### Task Creation Flow

```
POST /tasks → Auth Validator (Cognito JWT) → Jarvis Agent (Gemini Flash Lite)
            → Structured JSON → MySQL INSERT
```

**Auto-generated fields:**
- `title` — extracted from natural language
- `contexto` — Work / Home / Health / Personal
- `tag` — Deep Focus / Urgent / Social / Creative
- `categoria` — Task / Idea / Habit
- `prioridade` — low / medium / high
- `nivel_energia` — low / medium / high
- `duracao_estimada_minutos` — integer
- `notas` — details + user commands

### Notification Intelligence (Guardian Agent)

The most distinctive feature. Every hour, the Guardian Agent:

1. Queries all pending tasks from MySQL
2. Aggregates them into a single payload
3. Analyzes urgency, energy level, temporal context, and user commands
4. **Decides: YES (interrupt) or NO (silence)**

Decision criteria:
- **Energy level** — won't push heavy tasks when energy is low
- **Temporal blindness** — deadline < 1h = urgency spikes drastically
- **Temporal context** — late night / weekend = 10x more selective
- **Notes field is SUPREME** — commands like "Don't notify" override everything

Output: `{ decisao, motivo, mensagem }` (empathic message)

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|----------|
| **Orchestration** | n8n (self-hosted, Docker/AWS) | 3 flows via REST webhooks |
| **AI (Tasks)** | Google Gemini Flash Lite | Natural language → structured JSON |
| **AI (Notifications)** | Google Gemini Flash | Interrupt decision (more robust model) |
| **Memory** | Buffer Window Memory (n8n) | Session context for both agents |
| **Database** | MySQL | Tasks, status, sentiments, metrics |
| **Auth** | AWS Cognito (JWT) | Identity validation on all endpoints |
| **API** | REST (n8n webhooks) | POST, GET, PATCH, DELETE /tasks |
| **Frontend** | React + Vite + Tailwind | Zen Mode, Kanban, Focus Queue |
| **Hosting** | AWS (EC2/Docker + MySQL + Cognito) | Full self-hosted infrastructure |

## API Endpoints

| Method | Endpoint | Function | Auth |
|--------|----------|----------|------|
| `POST` | `/tasks` | Create task (natural language → AI → DB) | Cognito JWT |
| `GET` | `/tasks` | List tasks | Cognito JWT |
| `PATCH` | `/tasks` | Complete task (status + sentiment + duration) | Cognito JWT |
| `DELETE` | `/tasks` | Remove task | Cognito JWT |

## Database Schema

```sql
CREATE TABLE tasks (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  userId          VARCHAR(255) NOT NULL,
  title           VARCHAR(255) NOT NULL,
  frente          ENUM('trabalho','pessoal','saude','estudo') NOT NULL,
  tipo            ENUM('foco_profundo','manutencao_vital','rotina','urgente') NOT NULL,
  status          ENUM('todo','doing','blocked','done') DEFAULT 'todo' NOT NULL,
  prazo           TIMESTAMP NULL,
  prioridade      ENUM('baixa','media','alta') DEFAULT 'media' NOT NULL,
  esforco         ENUM('baixo','medio','alto') DEFAULT 'medio' NOT NULL,
  bloqueador      TEXT,
  notas           TEXT,
  criadoEm        TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  completadoEm    TIMESTAMP NULL,
  atualizadoEm    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);
```

## Self-Knowledge Collection

On task completion, the system collects 3 data points that traditional tools ignore:

| Data | What it captures | Value |
|------|-----------------|-------|
| **Real cognitive cost** | How much it actually cost mentally (vs. estimate) | Calibrates future estimates |
| **Post-completion sentiment** | Free text: "Tired, but satisfied with progress" | Maps emotional patterns |
| **Real duration** | Actual minutes vs. estimated | Combats temporal blindness |

Over time, this builds a **self-knowledge layer** that no task manager offers.

## Design Decisions

- **Gemini Flash Lite** for tasks — faster, cheaper (simple task: text → JSON)
- **Gemini Flash** for notifications — more robust (interrupt decision requires complex reasoning)
- **MySQL** over NoSQL — tabular data with aggregation queries (avg cognitive cost by context, etc.)
- **n8n self-hosted (Docker/AWS)** — full infrastructure control, no vendor lock-in, predictable costs
- **Buffer Window Memory** — session context for both agents (avoids repetitive notifications)

## Project Status

- [x] Task Creation flow (production webhooks)
- [x] Task Update flow
- [x] Notification Intelligence (Guardian Agent)
- [x] JWT Authentication (Cognito)
- [x] Full CRUD API
- [x] Frontend (Zen Mode, Kanban, Tasks, Blockers, Settings)
- [ ] Onboarding Interview (user profiling on signup)
- [ ] Focus Queue (show only the next logical task)

## Roadmap

1. **Onboarding Interview** — guided interview on signup so the agent knows the user's goals, routine, and preferences
2. **Focus Queue** — show only the next logical task
3. **Zen Mode** — reduced interface
4. **Cognitive load alerts** — suggest breaks, rescheduling
5. **Self-knowledge dashboard** — real vs. estimated cognitive cost over time

## Repository Structure

```
Jarvis/
├── server/              # Backend (Express + tRPC)
│   ├── _core/           # Server entry point + NLP task parser
│   └── infra/           # Docker Compose + EC2 setup scripts
├── client/              # Frontend (React + Vite + Tailwind)
│   └── src/
│       ├── _core/       # Auth context + hooks
│       ├── components/  # TaskForm, FocusQueue, ErrorBoundary
│       ├── pages/       # ZenMode, Kanban, Tasks, Settings
│       └── lib/         # API client
├── drizzle/             # Database schema + migrations
├── docs/                # Architecture, Guardian Agent, API reference
├── workflow/            # n8n workflow exports (JSON)
├── assets/              # Architecture diagrams (HLD/MLD/LLD)
└── package.json
```

## Getting Started

```bash
# Clone
git clone https://github.com/BrunoBarreto91/Jarvis.git
cd Jarvis

# Install dependencies
npm install

# Configure environment
cp .env.example .env
cp client/.env.example client/.env
# Edit both .env files with your credentials

# Run development server
npm run dev
```

## Site

[Jarvis — Project Page](https://main.d224tz0vfoxquk.amplifyapp.com/jarvis.html)

## License

MIT

## Author

**Bruno Barreto** — [github.com/BrunoBarreto91](https://github.com/BrunoBarreto91)
