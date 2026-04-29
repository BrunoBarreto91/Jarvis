# ADR-006 — Amplify L1 Constructs (CfnApp / CfnBranch) + CacheConfig Override

**Status:** Accepted  
**Date:** 2026-04-28  
**Amended:** 2026-04-29 (addPropertyOverride fallback for CacheConfig documented)  
**Author:** Kiro  
**Deciders:** Bruno Barreto

---

## Context

AWS CDK provides two levels of abstraction for AWS Amplify resources:

1. **L1 constructs** (`aws-cdk-lib/aws-amplify` — `CfnApp`, `CfnBranch`): Direct CloudFormation resource mappings. Verbose but stable and complete.
2. **L2 constructs** (`@aws-cdk/aws-amplify-alpha`): Higher-level, opinionated abstractions. Currently in **alpha/experimental** status.

The Jarvis project uses two Amplify apps:
- `Jarvis` (`d8zgj66tfcw7l`) — frontend SPA, pnpm build, no branch connected yet.
- `Bruno_Barreto-portfolio` (`do7m1qv1apsq6`) — static site, GitHub-connected, `main` branch in production.

Both apps have a `cacheConfig` property set to `AMPLIFY_MANAGED_NO_COOKIES`.

During the retroactive IaC migration, `cdk migrate` was attempted to auto-generate CDK code from the live Amplify resources. The migration failed with an error on the `CacheConfig` property — the L2 alpha construct does not expose this property, and `cdk migrate` could not map it.

---

## Decision

1. Model both Amplify apps and the portfolio branch using **L1 constructs** (`CfnApp` and `CfnBranch`) from `aws-cdk-lib/aws-amplify`.
2. Do **not** use `@aws-cdk/aws-amplify-alpha` (L2 experimental).
3. Set the `CacheConfig.Type` property via **`addPropertyOverride`** rather than the typed `cacheConfig` constructor prop.

---

## Rationale

### `cdk migrate` failure on CacheConfig

`cdk migrate` attempted to use the L2 alpha construct and failed because `@aws-cdk/aws-amplify-alpha` does not expose the `cacheConfig` property. The `AMPLIFY_MANAGED_NO_COOKIES` cache configuration is set on both live apps and must be preserved in CDK to avoid drift after import.

### Alpha stability risk

`@aws-cdk/aws-amplify-alpha` is explicitly marked as experimental. The CDK team may introduce breaking API changes in any release. For infrastructure that manages live production resources (the portfolio app has an active `main` branch in production), using an unstable API introduces unacceptable risk.

### L1 completeness

L1 constructs map 1:1 to CloudFormation resource properties. Every property available in the CloudFormation `AWS::Amplify::App` and `AWS::Amplify::Branch` resource types is accessible via L1. This guarantees that the CDK code can represent the full live state without workarounds.

### Import compatibility

`cdk import` works at the CloudFormation resource level. L1 constructs produce CloudFormation resources directly, making the import mapping straightforward. L2 constructs may generate multiple CloudFormation resources per construct, complicating the import mapping.

### CacheConfig via addPropertyOverride (Amendment 2026-04-29)

Even with L1 constructs, the CDK CloudFormation resource catalog may lag behind the live CloudFormation schema. The `CacheConfig` property (`AMPLIFY_MANAGED_NO_COOKIES`) was the exact property that caused `cdk migrate --from-scan` to fail in the initial migration attempt. To guard against the same issue at synth time, the property is set via `addPropertyOverride` rather than the typed constructor prop:

```typescript
// Do NOT use the typed prop — it may not be recognized by the CDK catalog version in use:
// cacheConfig: { type: 'AMPLIFY_MANAGED_NO_COOKIES' }  ← avoid

// Use addPropertyOverride instead — bypasses CDK type validation and writes
// directly to the CloudFormation template JSON:
cfnApp.addPropertyOverride('CacheConfig.Type', 'AMPLIFY_MANAGED_NO_COOKIES');
```

`addPropertyOverride` writes the value directly into the synthesized CloudFormation template, bypassing CDK's TypeScript type layer entirely. This is the correct escape hatch when the CDK catalog lags behind a live CloudFormation property.

---

## Trade-offs

| Concern | L1 + addPropertyOverride (chosen) | L2 alpha (rejected) |
|---|---|---|
| Stability | Stable (part of `aws-cdk-lib`) | Experimental (breaking changes possible) |
| CacheConfig support | Yes (via `addPropertyOverride`) | No (not exposed) |
| Verbosity | Higher (explicit properties) | Lower (opinionated defaults) |
| Import compatibility | Direct (1:1 with CloudFormation) | Complex (may generate multiple resources) |
| Type safety for CacheConfig | None (string override) | N/A (not exposed at all) |
| Type safety for other props | Full (TypeScript types from CloudFormation schema) | Full (TypeScript types from L2 API) |

---

## Consequences

- **Positive:** CDK code is stable and will not break on CDK minor version upgrades.
- **Positive:** `CacheConfig.Type` is set correctly regardless of CDK catalog lag.
- **Positive:** `cdk import` mapping is straightforward.
- **Negative:** L1 code is more verbose than L2. Developers must know the CloudFormation property names rather than the CDK-idiomatic API.
- **Negative:** `addPropertyOverride` bypasses TypeScript type checking for the overridden property. A typo in the property path or value will not be caught at compile time — it will surface as a CloudFormation error at deploy time.
- **Negative:** L1 constructs do not provide CDK-level validation (e.g., no compile-time check that a branch name is valid). Errors surface at CloudFormation deployment time.

---

## Revisit Criteria

This decision should be revisited when `@aws-cdk/aws-amplify-alpha` reaches stable status (moves to `aws-cdk-lib/aws-amplify` as an L2 construct). At that point, migrating from L1 to L2 would reduce verbosity and improve developer experience. The migration would require verifying that the stable L2 API exposes `cacheConfig` and all other properties currently set on the live apps, making `addPropertyOverride` unnecessary.
