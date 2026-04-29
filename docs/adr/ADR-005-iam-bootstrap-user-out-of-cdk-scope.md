# ADR-005 — IAM Deployer User "Kiro" Outside CDK Scope

**Status:** Accepted  
**Date:** 2026-04-28  
**Author:** Kiro  
**Deciders:** Bruno Barreto

---

## Context

The Jarvis AWS infrastructure is deployed using an IAM user named "Kiro" in account `733048624030`. This user was created manually and holds the AWS credentials used by the Kiro IDE agent to provision and manage infrastructure.

The question arose: should the "Kiro" IAM user and its attached policies be modeled in the CDK stack?

The IAM user's current policy set (from `infra/scan-baseline/iam-kiro-policies.json`) includes permissions for EC2, RDS, Amplify, Cognito, Secrets Manager, CloudFormation, and CDK bootstrap resources.

---

## Decision

The "Kiro" IAM user and its attached policies are **explicitly excluded from the CDK stack scope**.

The IAM user is managed outside CDK — directly via the AWS Console or CLI — and will not be imported into or managed by `JarvisStack`.

---

## Rationale

### The bootstrapping paradox

Managing the deployer IAM user in CDK creates a circular dependency: the CDK stack requires the IAM user's credentials to deploy, but the IAM user's permissions are defined in the CDK stack being deployed. If the IAM user's permissions are accidentally removed or the stack fails mid-deploy, the deployer loses the ability to fix the stack.

This is a well-known anti-pattern in IaC: **the entity that deploys infrastructure should not be managed by the infrastructure it deploys**.

### Blast radius containment

If the CDK stack is accidentally destroyed (despite `RemovalPolicy.RETAIN` on stateful resources), the IAM user must survive to allow recovery. Keeping the IAM user outside CDK ensures it is never at risk from stack operations.

### Separation of concerns

IAM user management is an account-level concern, not a stack-level concern. The "Kiro" user may be used to deploy multiple stacks in the future. Tying it to `JarvisStack` would create an inappropriate coupling.

### CDK bootstrap already manages deployer permissions partially

CDK bootstrap (`cdk bootstrap`) creates an IAM role (`cdk-hnb659fds-deploy-role-733048624030-us-east-1`) that the deployer assumes during `cdk deploy`. The "Kiro" user's permissions to assume this role are managed at the account level, not in the application stack.

---

## Consequences

- **Positive:** No circular dependency between the deployer and the stack being deployed.
- **Positive:** The IAM user survives any stack operation, including accidental `cdk destroy`.
- **Positive:** IAM user permissions can be updated independently of the CDK stack lifecycle.
- **Negative:** The "Kiro" IAM user's permissions are not version-controlled in this repository. Changes to its policies must be tracked manually or via a separate IAM management process.
- **Negative:** There is no automated drift detection for the IAM user's permissions.

---

## Mitigation for the Negative Consequences

The IAM user's current policy snapshot is captured in `infra/scan-baseline/iam-kiro-policies.json` and `infra/scan-baseline/iam-kiro.json`. These files serve as a reference for the intended permission set. Any future changes to the IAM user's policies should be reflected in these files as a manual update.

---

## Alternatives Considered

### Manage IAM user in a separate CDK stack
A dedicated `IamStack` could manage the "Kiro" user independently of `JarvisStack`. This would provide version control for IAM policies without the circular dependency. This approach is valid but adds complexity that is not justified for a single-developer project at this stage. It can be adopted in a future iteration if the team grows.

### Use IAM roles instead of IAM users
AWS best practice recommends IAM roles over IAM users for programmatic access. Migrating from an IAM user to an IAM role (e.g., via AWS IAM Identity Center or an EC2 instance profile) is a future hardening step. It does not affect the current CDK scope decision.
