# ADR-003 — SSH and n8n Ports Open to the Internet

**Status:** Accepted (with acknowledged risk)  
**Date:** 2026-04-28  
**Author:** Kiro  
**Deciders:** Bruno Barreto

---

## Context

The `jarvis-n8n-sg` security group (`sg-000e5ba87e11b64c6`) currently allows inbound traffic from `0.0.0.0/0` on three ports:

| Port | Protocol | Purpose |
|---|---|---|
| 22 | TCP | SSH access to the EC2 instance |
| 80 | TCP | HTTP (currently unused; reserved for future reverse proxy) |
| 5678 | TCP | n8n web UI and webhook endpoints |

This configuration was set during imperative provisioning and is being preserved in CDK to match the live state. The CDK migration does not change security group rules.

---

## Decision

Preserve the existing security group rules in CDK as-is:
- TCP 22 from `0.0.0.0/0`
- TCP 80 from `0.0.0.0/0`
- TCP 5678 from `0.0.0.0/0`

This decision is explicitly acknowledged as a **development-environment trade-off** and is not suitable for production.

---

## Rationale

### Why this is acceptable for the current stage

- **Single-developer environment:** The Jarvis project is currently operated by a single developer. IP allowlisting would require updating the security group every time the developer's IP changes (dynamic residential ISP).
- **n8n basic auth is enabled:** The n8n web UI requires username/password authentication (see ADR-004). Port 5678 being open does not mean unauthenticated access is possible.
- **IMDSv2 is enforced:** The EC2 instance has `HttpTokens: required`, which prevents SSRF-based metadata credential theft even if an attacker reaches the instance.
- **No sensitive data on the EC2 instance itself:** The EC2 instance runs n8n workflows. Sensitive data (MySQL credentials) is stored in RDS, which is not publicly accessible (`publiclyAccessible: false`).
- **SSH key pair required:** SSH access requires the `jarvis-key` private key, which is not stored in the repository. Brute-force SSH attacks are mitigated by key-based authentication.

### Why the CDK migration preserves this state

The goal of this migration is to produce CDK code that matches the live state exactly. Changing security group rules during the migration would introduce drift between the CDK template and the live infrastructure, which is the opposite of the migration's objective. Security hardening is deferred to a future production hardening iteration.

---

## Acknowledged Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| SSH brute force | Medium | High | Key-based auth only; password auth disabled on the instance |
| n8n UI exposed | Medium | Medium | Basic auth enabled (ADR-004); no sensitive data in n8n itself |
| Port 80 unused but open | Low | Low | No service listening on port 80; close in production hardening |
| EC2 public IP changes on stop/start | Medium | Low | Dynamic IP is acceptable for dev; Elastic IP deferred |

---

## Consequences

- **Positive:** No operational friction for the developer (no IP allowlist management).
- **Positive:** CDK matches live state exactly — zero drift after import.
- **Negative:** The EC2 instance is reachable from the public internet on three ports. This is a known and accepted risk for the development environment.
- **Negative:** This configuration must be hardened before any production deployment. Required changes: restrict SSH to a bastion or VPN CIDR, put n8n behind an ALB with HTTPS, remove port 80 or redirect to HTTPS.

---

## Future Hardening (out of scope for this migration)

When the project moves toward production:
1. Restrict TCP 22 to a specific CIDR (VPN, bastion, or developer static IP).
2. Remove direct TCP 5678 exposure; route n8n through an ALB with HTTPS and a custom domain.
3. Remove TCP 80 or configure it as an HTTP→HTTPS redirect at the ALB level.
4. Consider AWS Systems Manager Session Manager as a replacement for SSH.
