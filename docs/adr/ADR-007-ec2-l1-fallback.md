# ADR-007 — EC2 L1 Construct Fallback (CfnInstance)

**Status:** Triggered — resolved with CfnInstance L1  
**Date:** 2026-04-29  
**Author:** Kiro  
**Deciders:** Bruno Barreto

---

## Context

The `JarvisN8nServer` EC2 instance was initially modeled using the CDK L2 `ec2.Instance` construct. During `cdk import`, two blocking issues were encountered:

1. **Auto-generated LaunchTemplate:** `requireImdsv2: true` caused CDK to generate an `AWS::EC2::LaunchTemplate` resource. The live instance has no associated LaunchTemplate, so CloudFormation rejected the import with `Fn::GetAtt references undefined resource JarvisN8nServerLaunchTemplateE9BDA2B7`.

2. **Auto-generated IAM Role and InstanceProfile:** The L2 `ec2.Instance` construct always generates an `AWS::IAM::Role` and `AWS::IAM::InstanceProfile`. The live instance was provisioned imperatively without CDK and has no CDK-managed IAM role attached. CloudFormation rejected the import with `Unresolved resource dependencies [JarvisN8nServerInstanceProfile942886F1, JarvisN8nServerInstanceRoleC3F5FEA7]`.

Both issues stem from the same root cause: the L2 construct generates auxiliary resources that don't exist in the live account and cannot be skipped during import.

---

## Decision

Replace the `ec2.Instance` L2 construct with `ec2.CfnInstance` L1 construct. The L1 construct maps 1:1 to the `AWS::EC2::Instance` CloudFormation resource with no auto-generated dependencies.

---

## Properties Requiring Overrides

Two properties are not in the `CfnInstance` TypeScript type definitions and must be set via `addPropertyOverride`:

| Property | Value | Reason |
|---|---|---|
| `BlockDeviceMappings.0.Ebs.Throughput` | `125` | Not in `CfnInstance.EbsProperty` type |

`MetadataOptions.HttpTokens` and `MetadataOptions.HttpPutResponseHopLimit` are set directly in the `metadataOptions` prop (they are typed on `CfnInstance`).

---

## Resolution

```typescript
const cfnInstance = new ec2.CfnInstance(this, 'JarvisN8nServer', {
  instanceType: 't3.micro',
  imageId: 'ami-0c1e21d82fe9c9336',
  availabilityZone: 'us-east-1a',
  subnetId: 'subnet-0fc0ba1fc079f68c3',
  securityGroupIds: [n8nSg.securityGroupId],
  keyName: 'jarvis-key',
  blockDeviceMappings: [{
    deviceName: '/dev/xvda',
    ebs: { volumeSize: 30, volumeType: 'gp3', iops: 3000, deleteOnTermination: true, encrypted: false },
  }],
  metadataOptions: { httpTokens: 'required', httpPutResponseHopLimit: 2, httpEndpoint: 'enabled' },
  propagateTagsToVolumeOnCreation: false,
  tags: [{ key: 'Name', value: 'jarvis-n8n-server' }, { key: 'Project', value: 'Jarvis' }],
});
cfnInstance.cfnOptions.deletionPolicy = cdk.CfnDeletionPolicy.RETAIN;
cfnInstance.cfnOptions.updateReplacePolicy = cdk.CfnDeletionPolicy.RETAIN;
cfnInstance.addPropertyOverride('BlockDeviceMappings.0.Ebs.Throughput', 125);
```

---

## References

- `infra/scan-baseline/ec2-jarvis-n8n.json` — live EC2 instance state at time of IaC migration
- Task 4.8 in `.kiro/specs/aws-bootstrap-cdk/tasks.md` — drift contingency instructions
- Task 11.4 — import step where this fallback was triggered
