---
inclusion: fileMatch
fileMatchPattern: ["workflow/**", "**/classification*"]
---

# Flow 2 — Classification

## Purpose
Enrich a raw thought with structured metadata across 8 canonical fields, using Gemini.

## Trigger
Queue event `thought.ingested` (consumed asynchronously after Flow 1).

## The 8 classification fields
1. **type** — one of: `task`, `idea`, `note`, `reminder`, `feeling`, `decision`, `question`, `other`
2. **domain** — one of: `work`, `personal`, `health`, `finance`, `relationships`, `learning`, `other`
3. **urgency** — integer 1–5
4. **estimated_cognitive_cost** — integer 1–5 (proxy for mental energy required)
5. **time_horizon** — one of: `now`, `today`, `this_week`, `this_month`, `someday`
6. **action_required** — boolean
7. **dependencies** — array of strings (free-form references the user mentioned)
8. **suggested_next_step** — string (1 sentence, imperative voice)

## Pipeline (high level)
1. **Load thought** by `thought_id`.
2. **Build prompt** from `prompts/classification.md` (versioned). Inject raw text and any retrieved user context.
3. **Call Gemini** with `temperature: 0.2`, `response_mime_type: application/json`, schema enforced.
4. **Validate response** against the 8-field schema. Reject and retry once on schema failure.
5. **Update thought record** with classification + `classified_at` timestamp + `classifier_version`.
6. **Emit event** `thought.classified` for Flow 3 (Guardian).

## Prompt rules (strict)
- Output **only** valid JSON matching the schema. No prose, no markdown.
- If any field is uncertain, return the most conservative value (e.g., `urgency: 1`, `action_required: false`).
- The prompt template lives at `prompts/classification.md` and is versioned alongside code.

## Cost control
- Use **Gemini Flash** for classification (not Pro). Latency target: under 2 seconds.
- Cache identical-text classifications for 24h (key: SHA-256 of normalized text).

## Failure modes
- Gemini timeout → mark thought as `classification_status = 'failed'`, queue for retry.
- Schema mismatch → log full payload, retry once with stricter prompt, then fail loudly.
- Quota exhausted → fall back to a rule-based classifier (keywords-only) and mark with `classifier_version = 'fallback-v1'`.