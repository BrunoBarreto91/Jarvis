---
inclusion: fileMatch
fileMatchPattern: ["workflow/**", "**/ingestion*"]
---

# Flow 1 — Ingestion

## Purpose
Receive raw natural-language thoughts from the user and persist a normalized record in MySQL. This is the entry point of every other flow.

## Trigger
`Webhook_IngestThought` — `POST /api/v1/thoughts`

## Input contract
{
"user_id": "string (Cognito sub)",
"raw_text": "string (1..4000 chars)",
"client_timestamp": "ISO-8601",
"client_context": {
"device": "string",
"app_version": "string"
}
}

## Pipeline (high level)
1. **Validate input** — reject if `raw_text` is empty, exceeds limits, or fails JWT validation.
2. **Generate `trace_id`** (UUID v4) and `thought_id` (UUID v7 to keep insertion order).
3. **Insert raw record** into the `thoughts` table with `processing_status = 'pending'`.
4. **Emit event** `thought.ingested` to the queue consumed by Flow 2 (Classification).
5. **Return acknowledgment** to caller with `thought_id` and `trace_id`.

## Output contract
{
"status": "ok",
"data": {
"thought_id": "uuid",
"trace_id": "uuid",
"received_at": "ISO-8601"
}
}

## Non-goals (explicit)
- **No classification** happens here.
- **No Guardian decision** happens here.
- **No LLM call** happens here. Ingestion must be sub-100ms.

## Failure modes
- Cognito JWT invalid → `401`, do not insert.
- DB unreachable → `503`, retry policy applies.
- Queue unreachable → record is still persisted; a reconciliation job re-emits the event.