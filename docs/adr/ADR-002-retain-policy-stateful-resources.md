# ADR-002 — RemovalPolicy.RETAIN for Stateful Resources

**Status:** Accepted  
**Date:** 2026-04-28  
**Amended:** 2026-04-29 (EC2/EBS retention semantics clarified)  
**Author:** Kiro  
**Deciders:** Bruno Barreto

---

## Context

AWS CDK's removal policy determines whether the underlying AWS resource is deleted when a CloudFormation stack is destroyed or a resource is removed from a stack.

The Jarvis stack contains resources with different risk profiles:

- **Stateful resources** (EC2 instance, RDS database, Cognito User Pool): contain data or state that cannot be trivially recreated. Accidental deletion would cause data loss or service disruption.
- **Stateless resources** (security groups, Amplify apps): can be recreated from CDK code without data loss.
- **Out-of-band resources** (Secrets Manager secret, RDS subnet group): not managed by CDK at all; removal policy does not apply.

---

## Decision

Apply `RemovalPolicy.RETAIN` to the following resources:

| Resource | Reason |
|---|---|
| `JarvisN8nServer` (EC2 instance) | Contains the running n8n service, systemd configuration, and any locally stored workflow state. Termination would cause service downtime. |
| `JarvisDb` (RDS instance) | Contains the `jarvis_db` MySQL database with all application data. Deletion would cause irreversible data loss. |
| `JarvisRdsSecret` (Secrets Manager secret) | Contains the RDS master password. Deletion would break the RDS connection from n8n and require manual secret recreation and re-import. |
| `JarvisUserPool` (Cognito User Pool) | Contains registered user accounts. Deletion would require all users to re-register and would invalidate all existing sessions. |

Apply `RemovalPolicy.DESTROY` (or accept CDK default) to:

| Resource | Reason |
|---|---|
| `JarvisN8nSg`, `JarvisRdsSg` | Security group rules are fully defined in CDK; recreatable with zero data loss. |
| `JarvisAmplifyApp`, `PortfolioAmplifyApp`, `PortfolioAmplifyMainBranch` | Amplify app configuration is fully defined in CDK; no user data stored. |

---

## EC2 / EBS Retention Trade-off (Amendment 2026-04-29)

The EC2 root volume (`vol-05044cdcd0b6f463d`) is modeled as a block device mapping on the instance with `deleteOnTermination: true`, matching the live configuration. This creates an important distinction:

**What `RemovalPolicy.RETAIN` on the EC2 instance protects against:**
- `cdk destroy` — CloudFormation will not terminate the instance. The instance and its EBS volume survive.
- Accidental removal of the `JarvisN8nServer` construct from the CDK stack — same protection.

**What `RemovalPolicy.RETAIN` does NOT protect against:**
- Manual termination of the instance via the AWS Console, AWS CLI, or EC2 Auto Recovery.
- If the instance is manually terminated, `deleteOnTermination: true` means the EBS volume is also deleted.

**In plain language:** CDK's retain policy is a guard against IaC accidents, not against operational actions. A developer who manually terminates the EC2 instance will also lose the root volume.

**Accepted trade-off:** The current configuration (`RETAIN` on instance, `deleteOnTermination: true` on volume) matches the live state and is appropriate for a development environment where the instance is rarely stopped and never manually terminated. The alternative — `deleteOnTermination: false` — would leave orphaned EBS volumes if the instance is ever replaced, adding operational overhead.

## Secrets Manager Secret Retention (Amendment 2026-04-29)

`JarvisRdsSecret` is managed by CDK as an `AWS::SecretsManager::Secret` resource with `DeletionPolicy: Retain` and `UpdateReplacePolicy: Retain`. This means:

**What RETAIN protects:**
- The secret container (the `AWS::SecretsManager::Secret` resource and its current `SecretString` version) survives `cdk destroy`.
- The current password value stored in AWS Secrets Manager is preserved.

**What CDK does NOT manage:**
- The secret's value. The password was set out-of-band via `aws secretsmanager create-secret` (Task 0.2) and lives in AWS Secrets Manager. CDK's template contains only the container metadata (name, description, deletion policy) — no `SecretString` or `GenerateSecretString` property.
- A redundant copy of the value is maintained in the Notion secure page "🔐 Infra AWS — Credenciais, IDs & Topologia" as a recovery reference.

**Recovery path if the secret is accidentally deleted from AWS:**
1. Retrieve the password from the Notion secure page.
2. Recreate the secret: `aws secretsmanager create-secret --name jarvis/rds/master-password --description "Jarvis RDS master credentials" --secret-string '{"username":"admin","password":"<FROM_NOTION>"}'`
3. Re-import into the CDK stack: follow the Task 0.2 + Step 4.5 sequence from the runbook.
4. Run `cdk diff` to confirm zero drift.

---

## Rationale

- **Defense in depth:** `RemovalPolicy.RETAIN` acts as a last line of defense against accidental `cdk destroy` or stack deletion. Even if a developer runs `cdk destroy` in error, the stateful resources survive.
- **Secrets Manager secret:** The secret container is retained so that `cdk destroy` does not delete the live password. The value is not managed by CDK — it lives in AWS only, with a redundant copy in Notion. RETAIN ensures the container and its current version survive stack operations.
- **Cognito User Pool:** AWS does not allow a deleted User Pool to be restored. All user accounts, groups, and identity pool associations are permanently lost on deletion. `RETAIN` is the only safe policy for a production-bound User Pool.
- **RDS:** Even with `backupRetention: 0` (matching the live state), the RDS instance itself is retained. Backup retention is a separate concern from instance deletion protection.

---

## Consequences

- **Positive:** Accidental `cdk destroy` will not delete the EC2 instance, RDS database, Secrets Manager secret, or Cognito User Pool.
- **Positive:** The policy is explicit and auditable in code — no implicit reliance on AWS defaults.
- **Negative:** Retained resources continue to incur AWS costs after a stack is deleted. A developer must manually delete them via the AWS Console or CLI if the environment is truly being decommissioned.
- **Negative:** `cdk destroy` will leave orphaned resources that are no longer tracked by CloudFormation. A cleanup runbook must be followed for full decommissioning.
- **Negative:** `RemovalPolicy.RETAIN` does not protect against manual instance termination. If the EC2 instance is manually terminated, the EBS volume is also deleted (due to `deleteOnTermination: true`).

---

## Future Work

- **Switch to `deleteOnTermination: false`** if the EC2 instance lifecycle becomes more dynamic (e.g., regular stop/start cycles, AMI baking, blue/green deployments). This would preserve the EBS volume across manual terminations at the cost of requiring explicit volume cleanup when the instance is replaced.
- **Enable RDS deletion protection** (`deletionProtection: true`) when the project moves toward production. Currently set to `false` to match the live state.

---

## Alternatives Considered

### RemovalPolicy.SNAPSHOT for RDS
AWS supports `RemovalPolicy.SNAPSHOT` for RDS, which takes a final snapshot before deletion. This was considered but rejected for the initial migration because:
1. The live RDS instance has `deletionProtection: false` and `backupRetention: 0` — matching this state is the migration goal.
2. `RETAIN` provides stronger protection than `SNAPSHOT` (no deletion at all vs. deletion with a snapshot).
3. Snapshot-based recovery adds operational complexity. `RETAIN` is simpler and safer for a development environment.

### RemovalPolicy.DESTROY for all resources
Rejected. The risk of accidental data loss outweighs the convenience of clean stack teardown. For a development environment with real user data (n8n workflows, MySQL records), `DESTROY` on stateful resources is unacceptable.
