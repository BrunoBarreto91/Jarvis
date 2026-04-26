---
inclusion: fileMatch
fileMatchPattern: ["README.md", "docs/**/*.md"]
---

# Tone Examples — Bad → Good

Use these as a calibration reference. Whenever in doubt about wording, find the closest example below.

## Personal framing → product framing

| ❌ Bad | ✅ Good |
|--------|---------|
| "I built this because of my ADHD." | "Built for users facing cognitive overload." |
| "I needed something to organize my chaos." | "Designed to reduce friction between thought and action." |
| "This helps me a lot." | "The system reduces decision fatigue measurably." |

## Personal config → configurable system

| ❌ Bad | ✅ Good |
|--------|---------|
| "Runs at 9 AM every morning." | "Runs on a configurable schedule." |
| "My urgency threshold is 4." | "Urgency thresholds are configurable per deployment." |
| "I gave focus_window a 25-minute cooldown." | "Focus windows accept a configurable cooldown interval." |

## Internal references → public references

| ❌ Bad | ✅ Good |
|--------|---------|
| "See my Notion page for details." | "See `docs/architecture.md` for details." |
| "Tracked in our internal CRM." | "Tracked in the project issue tracker." |
| "Slack #jarvis-dev for discussion." | "GitHub Discussions for project conversations." |

## Vague marketing → concrete claims

| ❌ Bad | ✅ Good |
|--------|---------|
| "Revolutionary AI productivity tool." | "Classifies inputs across 8 fields and decides interruption autonomously." |
| "Lightning-fast and incredibly smart." | "Sub-100ms ingestion, sub-2s classification with Gemini Flash." |
| "Built with cutting-edge technology." | "Built with n8n, Gemini, MySQL on AWS RDS, and Cognito." |

## First-person → third-person / passive

| ❌ Bad | ✅ Good |
|--------|---------|
| "I designed the Guardian to..." | "The Cognitive Guardian is designed to..." |
| "We track every decision." | "Every decision is logged in `guardian_audit`." |
| "I chose React because..." | "React was selected for its component model and ecosystem." |