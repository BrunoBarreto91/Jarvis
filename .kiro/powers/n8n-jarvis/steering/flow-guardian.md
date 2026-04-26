---
inclusion: fileMatch
fileMatchPattern: ["workflow/**", "**/guardian*"]
---

# Flow 3 — Cognitive Guardian

> ⚠️ **Proprietary core.** Do not delegate the decision logic to a third-party library.
> Any change to thresholds or signals must be documented as an ADR.

## Purpose
Decide autonomously whether to interrupt the user with a notification, surface the thought silently, or hold it back entirely. This is what protects the user's mental energy.

## Trigger
Queue event `thought.classified` (after Flow 2).

## Inputs
- The classified thought record (8 fields from Flow 2).
- The user's **current cognitive state vector**, derived from:
  - Recent activity in the last 60 minutes (number of thoughts ingested, average urgency).
  - Time of day relative to the user's declared focus windows.
  - Pending high-cost thoughts already in the queue.
  - Last interruption timestamp (cooldown signal).

## Decision output
One of three actions:
1. **`interrupt`** — push notification, surface immediately.
2. **`surface`** — appear silently the next time the user opens the app.
3. **`hold`** — keep in queue, re-evaluate in the next cycle.

## Decision criteria (current rules — see ADRs for evolution)
- `interrupt` requires **all** of:
  - `urgency >= 4` AND `time_horizon` in (`now`, `today`)
  - User is inside a configured focus-permitting window (or no window is set).
  - No interruption in the last `cooldown_minutes` (configurable).
  - Total queued cognitive cost is below the user's daily threshold.
- `hold` is chosen when:
  - `estimated_cognitive_cost >= 4` AND queued cost is already at threshold.
  - User is inside a "do not disturb" window.
- `surface` is the default fallback for everything else.

## Output side effects
- Update thought with `guardian_decision`, `guardian_decided_at`, `guardian_reason` (short string for explainability).
- If `interrupt`, call the notification service (FCM/APNS via push gateway).
- Append to the `guardian_audit` table for longitudinal analysis (Self-Knowledge Collection pillar).

## Explainability
Every decision must produce a `guardian_reason` string of the form:
- `"interrupt: urgency=5, focus_window=open, cooldown_ok"`
- `"hold: queued_cost=8/8, dnd_active"`
- `"surface: default"`

This is what allows the user (and the Self-Knowledge layer) to audit the system over time.

## Forbidden
- Do **not** call an LLM here. The decision must be deterministic and sub-50ms.
- Do **not** introduce probabilistic/ML scoring without an ADR. The current logic is rule-based by design (auditability, low latency, no drift).
- Do **not** outsource to memory libraries (e.g., MemPalace) — see project-level decision in `docs/adr/`.