---
inclusion: manual
---

# Sanitization Checklist — Pre-Publish

> Trigger this checklist with `#sanitize` before any PR that touches `README.md`, `docs/**`, or any public-facing file.

## Identity and personal data
- [ ] No phone, address, or personal email
- [ ] No mention of ADHD, depression, or any personal condition
- [ ] No first-person diary tone ("I built this because...")
- [ ] No screenshots that reveal personal context (calendars, chats, real names)

## Internal links and references
- [ ] No `notion.so/...` URLs
- [ ] No `notion://...` URIs
- [ ] No internal Slack channel names
- [ ] No project codenames not approved for public use

## Configuration leakage
- [ ] No personal weights, thresholds, or scoring values
- [ ] No specific schedules ("runs at 9 AM")
- [ ] No personal focus windows
- [ ] No cooldown minutes or specific timing constants
- [ ] All configurable values described as "configurable" rather than fixed

## Language and tone
- [ ] Entire document in EN-US
- [ ] No Portuguese fragments left over
- [ ] No code comments in Portuguese
- [ ] Tone is impersonal and declarative throughout
- [ ] Examples are generic enough to apply to any user

## Technical accuracy
- [ ] All endpoints documented match `server/` source code
- [ ] All architecture claims match `docs/architecture.md`
- [ ] No inflated claims or unverifiable benchmarks
- [ ] All external links resolve and are stable

## Final pass
- [ ] Read the first paragraph aloud — does it sound like a product page or a personal blog?
- [ ] Search the file for `I `, `my `, `me ` — should be near zero in EN-US public docs.
- [ ] Search for `TDAH`, `ansiedade`, `depressão` — must be zero.