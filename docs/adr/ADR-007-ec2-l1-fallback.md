# ADR-007 — EC2 L1 Construct Fallback (CfnInstance)

**Status:** Placeholder — Not triggered yet  
**Date:** 2026-04-29  
**Author:** Kiro  
**Deciders:** Bruno Barreto

---

## Context

The `JarvisN8nServer` EC2 instance is modeled using the CDK L2 `ec2.Instance` construct. After `cdk import`, a `cdk diff` is run to verify zero drift between the CDK template and the live resource (`i-08df068d510d2475d`).

Certain EC2 properties are known to be difficult for the L2 `ec2.Instance` construct to express exactly:

- `HttpPutResponseHopLimit` (IMDSv2 hop limit) — set to `2` on the live instance
- gp3 IOPS (`3000`) and throughput (`125 MB/s`) on the root EBS volume
- Tags applied directly to the instance vs. propagated to volumes

If `cdk diff` reports drift on any of these properties after import, the L2 construct cannot be reconciled without a `cdk deploy` that would modify the live instance. In that case, the fallback is to replace the L2 construct with an L1 `CfnInstance` construct that maps the CloudFormation properties 1:1 to the live resource.

---

## Decision

**Not triggered yet.**

This ADR will be updated with the specific drift properties and resolution steps if the L1 fallback is triggered during Task 11.4 (import `JarvisN8nServer` and run `cdk diff`).

---

## Trigger Condition

This ADR is activated if `cdk diff` after `cdk import JarvisStack/JarvisN8nServer` reports drift on any of:

- `MetadataOptions.HttpPutResponseHopLimit`
- `BlockDeviceMappings[0].Ebs.Iops`
- `BlockDeviceMappings[0].Ebs.Throughput`
- Tags that the L2 construct cannot express without generating additional CloudFormation resources

---

## Fallback Procedure (if triggered)

1. Replace `ec2.Instance` L2 construct in `infra/lib/jarvis-stack.ts` with `ec2.CfnInstance` L1 construct.
2. Map all properties directly from `infra/scan-baseline/ec2-jarvis-n8n.json` to ensure exact match with the live resource.
3. Re-run `cdk synth` and verify the synthesized template matches the scan baseline.
4. Re-import: `cdk import JarvisStack/JarvisN8nServer --resource-mapping '{"JarvisN8nServer": {"InstanceId": "i-08df068d510d2475d"}}'`
5. Run `cdk diff` — must show zero drift before proceeding to Task 11.5.
6. Update this ADR with the specific drift properties observed and the L1 construct properties used to resolve them.

---

## References

- `infra/scan-baseline/ec2-jarvis-n8n.json` — live EC2 instance state at time of IaC migration
- Task 4.8 in `.kiro/specs/aws-bootstrap-cdk/tasks.md` — drift contingency instructions
- Task 11.4 — import step where this fallback may be triggered
