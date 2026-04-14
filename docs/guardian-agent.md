# Guardian Agent — Cognitive Notification Intelligence

The Guardian Agent is the most distinctive feature of Jarvis. It is not a timer or alarm — it is an AI agent that **decides whether it is worth interrupting the user** every hour.

## How It Works

Every hour, the Guardian Agent:

1. Queries all pending tasks from MySQL
2. Aggregates them into a single payload
3. Analyzes urgency, energy level, temporal context, and user commands
4. **Decides: YES (interrupt) or NO (silence)**

## Decision Criteria

| Criterion | Behavior |
|-----------|----------|
| **Energy Level** | Won't push heavy tasks when energy is low. Suggests something light or silence. |
| **Temporal Blindness** | If deadline is past or < 1h away, urgency spikes drastically. |
| **Temporal Context** | Late night / weekend = 10x more selective. Only interrupts for critical actions. |
| **Notes Field (Supreme)** | Commands like "Don't notify" or "Notify urgently" override all other rules. |

## Result

The user is never bombarded with useless notifications. Each interruption is deliberate and empathic.

## Output Format

```json
{
  "decisao": "SIM" | "NAO",
  "motivo": "String explaining the reasoning",
  "mensagem": "Empathic message to the user"
}
```

## System Prompt

> You are Jarvis, the Cognitive Guardian for the user. Analyze the task list. Guidelines: NOTES (supreme), energy balance, temporal blindness, temporal context. Output: JSON with `decisao` (YES/NO), `motivo`, empathic `mensagem`.

## AI Model

Uses **Google Gemini Flash** (more robust than Flash Lite) because the interrupt decision requires complex multi-factor reasoning across urgency, energy, temporal context, and explicit user commands.

## Session Memory

The Guardian Agent uses **Buffer Window Memory** (n8n) to maintain a history of recent decisions, preventing repetitive notifications for the same tasks.
