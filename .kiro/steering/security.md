---
inclusion: always
---

# Security & Credential Hygiene — Standing Rules

## Proactive checks (no command needed)
At the start of every session and before every commit-related action, Kiro MUST:
1. Verify `.kiro/settings/mcp.json` is listed in both `.gitignore` and `.kiroignore`.
2. Verify `.env` and `.env.*` are listed in both `.gitignore` and `.kiroignore`.
3. Scan any file about to be written or modified for credential patterns (tokens, keys, passwords, secrets).
4. Report a security status summary to the user — green if clean, red with details if not.

## Files that must never be committed
- `.env`, `.env.*`, `.env.local`, `.env.production`, `.env.staging`
- `.kiro/settings/mcp.json` (contains MCP server tokens)
- `*.pem`, `*.key`, `secrets/**`
- `sql/seed_*.sql`

## Credential patterns to flag
- Strings matching `ntn_[a-zA-Z0-9]{40,}` (Notion integration tokens)
- Strings matching `sk-[a-zA-Z0-9]{40,}` (OpenAI keys)
- Strings matching `AKIA[A-Z0-9]{16}` (AWS access key IDs)
- Any string labeled `password`, `secret`, `token`, `api_key`, `apikey`, `Authorization` with a non-placeholder value
- Cognito pool IDs with real region prefixes (e.g. `us-east-1_[A-Za-z0-9]+` that are not `XXXXXXXXX`)

## .env.example rule
- MUST exist for every package that consumes env vars.
- MUST contain only placeholder values (no real credentials).
- Kiro MUST verify this before writing any `.env.example`.

## Response format
Always end security-sensitive sessions with:
```
🔒 Security status: [CLEAN / ACTION REQUIRED]
- .gitignore covers mcp.json: ✅ / ❌
- .kiroignore covers mcp.json: ✅ / ❌
- .env files ignored: ✅ / ❌
- No credentials in tracked files: ✅ / ❌
```
