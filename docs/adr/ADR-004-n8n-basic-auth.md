# ADR-004 — n8n Basic Authentication

**Status:** Accepted (with acknowledged risk)  
**Date:** 2026-04-28  
**Author:** Kiro  
**Deciders:** Bruno Barreto

---

## Context

The n8n instance running on the EC2 server (`jarvis-n8n-server`) is accessible on port 5678 from the public internet (see ADR-003). n8n supports several authentication mechanisms:

1. **Basic auth** — username/password configured via environment variables (`N8N_BASIC_AUTH_ACTIVE`, `N8N_BASIC_AUTH_USER`, `N8N_BASIC_AUTH_PASSWORD`).
2. **n8n's built-in user management** — email/password accounts managed within n8n itself (available since n8n v0.214).
3. **Reverse proxy with external auth** — nginx or Caddy in front of n8n, delegating auth to an external provider (e.g., Cognito, OAuth2 Proxy).
4. **No authentication** — not acceptable for a publicly accessible instance.

The live n8n instance (v2.18.4) is currently running with **basic auth enabled** via systemd environment variables.

---

## Decision

Preserve n8n basic authentication as the authentication mechanism for the n8n web UI and API. This configuration is managed outside CDK (via systemd on the EC2 instance) and is not modeled in the CDK stack.

---

## Rationale

### Why basic auth is acceptable for the current stage

- **Single-user environment:** The n8n instance is used exclusively by one developer. The overhead of a full OAuth2/OIDC integration is not justified.
- **n8n is an internal tool:** n8n is not a user-facing application. It is an automation backend. The Jarvis frontend authenticates via Cognito (see Requirement 7); n8n is accessed directly only by the developer.
- **Simplicity:** Basic auth requires zero additional infrastructure. A reverse proxy with Cognito integration would require an ALB, a custom domain, ACM certificate, and OAuth2 Proxy configuration — all out of scope for the current development phase.
- **Credentials are not in the repository:** The n8n basic auth credentials are stored in the systemd environment file on the EC2 instance, not in any tracked file.

### Why this is not modeled in CDK

The n8n authentication configuration lives in the systemd service file on the EC2 instance (`/etc/systemd/system/n8n.service` or equivalent). CDK does not manage instance user data or systemd configuration for imported instances. Modeling this in CDK would require either:
- A `UserData` script (which only runs on first launch — not applicable to an imported instance), or
- AWS Systems Manager Parameter Store + a configuration management tool (out of scope).

The n8n auth configuration is therefore documented here as an architectural decision but is not enforced by CDK.

---

## Acknowledged Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Basic auth credentials transmitted in cleartext over HTTP | Medium | High | n8n is accessed over HTTP (no TLS); credentials are base64-encoded, not encrypted. Acceptable for dev; must be fixed for production. |
| Weak password chosen for basic auth | Low | High | Developer responsibility; no enforcement mechanism in CDK. |
| Basic auth credentials stored in systemd env file | Low | Medium | File is on the EC2 instance, not in the repository. Access requires SSH with `jarvis-key`. |

---

## Consequences

- **Positive:** Zero additional infrastructure required for n8n authentication.
- **Positive:** CDK stack remains simple — no ALB, no custom domain, no OAuth2 Proxy.
- **Negative:** Credentials are transmitted over HTTP (no TLS). This is a known risk for the development environment.
- **Negative:** Basic auth provides no session management, no MFA, and no audit log of individual user actions within n8n.

---

## Future Hardening (out of scope for this migration)

When the project moves toward production:
1. Place n8n behind an ALB with an ACM certificate (HTTPS).
2. Replace basic auth with n8n's built-in user management or an OAuth2 Proxy integrated with Cognito.
3. Enable n8n audit logging.
4. Consider restricting n8n access to internal VPC traffic only (no public exposure).
