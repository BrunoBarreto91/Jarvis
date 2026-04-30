---
inclusion: fileMatch
fileMatchPattern: ["workflow/**", "server/n8n/**"]
---

# n8n Conventions — Jarvis

This document defines the conventions used across all n8n workflows in Jarvis. Any new node, branch, or workflow must comply.

## Node naming
- Use **PascalCase** with an action verb prefix: `ParseUserInput`, `ClassifyWithGemini`, `WriteToMySQL`.
- Webhook nodes start with `Webhook_`: `Webhook_IngestThought`, `Webhook_GuardianTrigger`.
- Set nodes that mutate data start with `Set_`: `Set_NormalizedRecord`, `Set_GuardianContext`.
- Avoid generic names like `Node1`, `Function2`, `HTTP Request3`.

## Error handling
- Every external call (Gemini API, MySQL, S3) must have an **Error Trigger** branch that:
  1. Logs the error to CloudWatch via a dedicated `Log_Error` node.
  2. Sends a sanitized failure response to the caller (no stack traces, no credentials).
  3. Tags the record in MySQL as `processing_status = 'failed'` for later replay.
- Retry policy: 3 attempts with exponential backoff (1s, 4s, 16s). After that, fail loudly.

## Secrets and credentials
- **Never hardcode** API keys, DB passwords, or JWTs in node parameters.
- Use n8n Credentials objects, populated from AWS Secrets Manager or environment variables.
- The export file `workflow/jarvis_workflow.json` must be sanitized before commit. Strip credential IDs and any `apiKey` fields before pushing.

## Webhook contract
- All inbound webhooks accept JSON only.
- Required headers: `Authorization: Bearer <Cognito JWT>`, `Content-Type: application/json`.
- Standard response shape:
{
"status": "ok" | "error",
"data": { ... } | null,
"error": { "code": "STRING", "message": "STRING" } | null,
"trace_id": "uuid"
}

## Logging
- Every flow logs at start, at each external call, and at completion.
- Log fields: `trace_id`, `flow_name`, `node_name`, `event`, `duration_ms`, `user_id` (hashed).
- **Never log raw user input** — it may contain PII. Log a hash or token count instead.

## Versioning
- Workflows are exported as JSON and committed to `workflow/`.
- Each export commit must reference the n8n version in the message: `chore(workflow): export v1.4 (n8n 1.62.0)`.