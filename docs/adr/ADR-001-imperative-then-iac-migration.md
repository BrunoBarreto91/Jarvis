# ADR-001 — Imperative-First Provisioning, Retroactive IaC Migration

**Status:** Accepted  
**Date:** 2026-04-28  
**Author:** Kiro (automated provisioning instance)  
**Deciders:** Bruno Barreto

---

## Context

The Jarvis project required AWS infrastructure to be operational quickly on 2026-04-28. The resources needed were: an EC2 instance running n8n, an RDS MySQL database, two Amplify apps, and supporting security groups. At the time of provisioning, no CDK project existed and no IaC tooling was bootstrapped for this account.

Two approaches were available:

1. **IaC-first:** Set up CDK, write constructs, synthesize, and deploy — then verify the live environment matches intent.
2. **Imperative-first:** Provision resources directly via AWS CLI / Console to get the environment running immediately, then retroactively migrate to IaC.

---

## Decision

We chose **imperative-first provisioning** followed by a **retroactive IaC migration** using AWS CDK v2 (TypeScript).

The live resources were provisioned imperatively on 2026-04-28. This spec (`aws-bootstrap-cdk`) captures the retroactive migration: CDK constructs are written to match the live state exactly, and existing resources are adopted into CloudFormation management via `cdk import` — never recreated.

---

## Rationale

- **Speed to value:** The n8n automation workflows needed to be operational immediately. IaC setup would have added hours of overhead before the first resource was live.
- **Risk isolation:** Provisioning imperatively first allowed the environment to be validated before any IaC abstraction was introduced. The IaC migration is a separate, lower-risk operation.
- **`cdk import` makes this safe:** AWS CDK's `cdk import` command allows existing resources to be brought under CloudFormation management without recreation. This eliminates the primary risk of retroactive migration (data loss or downtime).
- **Scan baseline as source of truth:** Before writing any CDK code, a full scan of the live account was captured in `infra/scan-baseline/`. This ensures the CDK constructs reflect the actual live state, not an assumed state.

---

## Consequences

- **Positive:** Infrastructure is now version-controlled and drift-detectable. Future changes go through CDK.
- **Positive:** The scan baseline (`infra/scan-baseline/`) serves as a permanent audit record of the pre-IaC state.
- **Negative:** There is a window between initial provisioning and IaC adoption during which infrastructure changes are not tracked in version control. This window is closed by this migration.
- **Negative:** `cdk import` requires careful property matching between CDK constructs and live resources. Any mismatch causes drift that must be resolved before deploying changes.
- **Mitigation:** The `cdk diff` command is run after every import step to confirm zero drift before proceeding.

---

## Alternatives Considered

### IaC-first
Rejected because it would have delayed the operational environment by hours. The Jarvis project was in an active development phase where the n8n workflows needed to be running to unblock other work.

### Terraform instead of CDK
Rejected because the project's tech stack is TypeScript throughout (frontend, backend, tooling). CDK allows infrastructure to be expressed in the same language as the application code, reducing context switching and enabling type-safe construct composition.

### `cdk migrate` (auto-generate CDK from live state)
Attempted but rejected. `cdk migrate` failed on the Amplify `CacheConfig` property, producing invalid TypeScript. Manual CDK authoring against the scan baseline produces more idiomatic and maintainable code.
