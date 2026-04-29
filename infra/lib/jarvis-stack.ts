import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as amplify from 'aws-cdk-lib/aws-amplify';
import { Construct } from 'constructs';

export class JarvisStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ─────────────────────────────────────────────────────────────────────────
    // 1. VPC — reference existing default VPC (not managed by CDK)
    // ─────────────────────────────────────────────────────────────────────────
    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVpc', {
      isDefault: true,
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Security Groups
    // ─────────────────────────────────────────────────────────────────────────

    // N8N security group — SSH, HTTP, n8n port open to internet
    const n8nSg = new ec2.SecurityGroup(this, 'JarvisN8nSg', {
      vpc,
      securityGroupName: 'jarvis-n8n-sg',
      description: 'Security Group for Jarvis n8n server',
      allowAllOutbound: true,
    });
    n8nSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22),   'SSH');
    n8nSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80),   'HTTP');
    n8nSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(5678), 'n8n');
    n8nSg.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // RDS security group — MySQL accessible from n8n SG only
    const rdsSg = new ec2.SecurityGroup(this, 'JarvisRdsSg', {
      vpc,
      securityGroupName: 'jarvis-rds-sg',
      description: 'Security Group for Jarvis RDS MySQL - EC2 access only',
      allowAllOutbound: true,
    });
    rdsSg.addIngressRule(n8nSg, ec2.Port.tcp(3306), 'MySQL from n8n SG');
    rdsSg.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // ─────────────────────────────────────────────────────────────────────────
    // 3. EC2 Instance — jarvis-n8n-server (imported, not created)
    // ─────────────────────────────────────────────────────────────────────────
    const n8nInstance = new ec2.Instance(this, 'JarvisN8nServer', {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO,
      ),
      machineImage: ec2.MachineImage.genericLinux({
        'us-east-1': 'ami-0c1e21d82fe9c9336',
      }),
      availabilityZone: 'us-east-1a',
      vpcSubnets: {
        subnets: [
          ec2.Subnet.fromSubnetAttributes(this, 'N8nSubnet', {
            subnetId: 'subnet-0fc0ba1fc079f68c3',
            availabilityZone: 'us-east-1a',
          }),
        ],
      },
      securityGroup: n8nSg,
      // jarvis-key is NOT managed by CDK — set via L1 override to avoid key pair lookup
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(30, {
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            iops: 3000,
            throughput: 125,
            deleteOnTermination: true,
            encrypted: false,
          }),
        },
      ],
      requireImdsv2: true,
      propagateTagsToVolumeOnCreation: false,
    });
    // Set HttpPutResponseHopLimit: 2 via L1 escape hatch — cannot combine with requireImdsv2 in props
    const cfnInstance = n8nInstance.node.defaultChild as ec2.CfnInstance;
    cfnInstance.addPropertyOverride('MetadataOptions.HttpPutResponseHopLimit', 2);
    // Set KeyName via L1 — avoids CDK key pair lookup, key is managed outside CDK
    cfnInstance.addPropertyOverride('KeyName', 'jarvis-key');
    cdk.Tags.of(n8nInstance).add('Name', 'jarvis-n8n-server');
    cdk.Tags.of(n8nInstance).add('Project', 'Jarvis');
    // RETAIN: protects against `cdk destroy`. Does NOT prevent manual termination.
    // If the instance is manually terminated, the EBS volume is also deleted
    // (deleteOnTermination: true). See ADR-002.
    n8nInstance.applyRemovalPolicy(cdk.RemovalPolicy.RETAIN);

    // ─────────────────────────────────────────────────────────────────────────
    // 4. RDS Secrets Manager Secret
    //    CDK manages the container (name, description, deletion policy).
    //    The actual password value is bootstrapped out-of-band (Task 0.2)
    //    and never appears in this template.
    //
    //    Why CfnSecret (L1) instead of Secret (L2):
    //    The L2 Secret construct always synthesizes GenerateSecretString or
    //    SecretString. GenerateSecretString would overwrite the live password
    //    on the first deploy after import; SecretString would embed it in the
    //    template. L1 CfnSecret avoids both problems.
    // ─────────────────────────────────────────────────────────────────────────
    const rdsSecret = new secretsmanager.CfnSecret(this, 'JarvisRdsSecret', {
      name: 'jarvis/rds/master-password',
      description: 'Jarvis RDS master credentials',
      // No secretString or generateSecretString — value lives in AWS only.
    });
    rdsSecret.cfnOptions.deletionPolicy = cdk.CfnDeletionPolicy.RETAIN;
    rdsSecret.cfnOptions.updateReplacePolicy = cdk.CfnDeletionPolicy.RETAIN;

    // ISecret reference for rds.Credentials.fromSecret
    const rdsSecretRef = secretsmanager.Secret.fromSecretCompleteArn(
      this,
      'JarvisRdsSecretRef',
      rdsSecret.attrId,
    );

    // ─────────────────────────────────────────────────────────────────────────
    // 5. RDS Instance — jarvis-db (imported, not created)
    //    Subnet group already exists in the live account — referenced via
    //    fromSubnetGroupName so CDK does NOT synthesize AWS::RDS::DBSubnetGroup.
    // ─────────────────────────────────────────────────────────────────────────
    const rdsSubnetGroup = rds.SubnetGroup.fromSubnetGroupName(
      this,
      'JarvisDbSubnetGroup',
      'jarvis-db-subnet-group',
    );

    const rdsInstance = new rds.DatabaseInstance(this, 'JarvisDb', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_45,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO,
      ),
      vpc,
      subnetGroup: rdsSubnetGroup,
      // Do NOT set vpcSubnets or subnetGroupName — would cause CDK to
      // synthesize a new subnet group resource, colliding with the existing one.
      securityGroups: [rdsSg],
      credentials: rds.Credentials.fromSecret(rdsSecretRef, 'admin'),
      databaseName: 'jarvis_db',
      instanceIdentifier: 'jarvis-db',
      allocatedStorage: 20,
      storageType: rds.StorageType.GP2,
      multiAz: false,
      publiclyAccessible: false,
      backupRetention: cdk.Duration.days(0),
      deletionProtection: false,
      storageEncrypted: false,
      autoMinorVersionUpgrade: true,
    });
    cdk.Tags.of(rdsInstance).add('Project', 'Jarvis');
    rdsInstance.applyRemovalPolicy(cdk.RemovalPolicy.RETAIN);

    // ─────────────────────────────────────────────────────────────────────────
    // 6. Cognito User Pool — net-new resource (not imported)
    // ─────────────────────────────────────────────────────────────────────────
    const userPool = new cognito.UserPool(this, 'JarvisUserPool', {
      userPoolName: 'jarvis-user-pool',
      signInAliases: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
      },
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      mfa: cognito.Mfa.OFF,
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      selfSignUpEnabled: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 7. Cognito App Client — net-new resource (not imported)
    //    idTokenValidity must be set explicitly when access/refresh are customized.
    // ─────────────────────────────────────────────────────────────────────────
    const userPoolClient = new cognito.UserPoolClient(this, 'JarvisUserPoolClient', {
      userPool,
      userPoolClientName: 'jarvis-web-client',
      generateSecret: false,
      authFlows: {
        userSrp: true,
      },
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
      writeAttributes: new cognito.ClientAttributes()
        .withStandardAttributes({ email: true, fullname: true }),
      preventUserExistenceErrors: true,
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 8. Amplify — Jarvis app (L1 construct, imported)
    //    CacheConfig applied via addPropertyOverride — the CDK CloudFormation
    //    catalog may lag on AMPLIFY_MANAGED_NO_COOKIES. See ADR-006.
    // ─────────────────────────────────────────────────────────────────────────
    const amplifyJarvis = new amplify.CfnApp(this, 'JarvisAmplifyApp', {
      name: 'Jarvis',
      platform: 'WEB',
      enableBranchAutoDeletion: false,
      basicAuthConfig: { enableBasicAuth: false },
      buildSpec: [
        'version: 1',
        'frontend:',
        '  phases:',
        '    preBuild:',
        '      commands:',
        '        - corepack enable',
        '        - corepack prepare pnpm@latest --activate',
        '        - pnpm install --frozen-lockfile',
        '    build:',
        '      commands:',
        '        - pnpm run build',
        '  artifacts:',
        '    baseDirectory: dist',
        '    files:',
        "      - '**/*'",
        '  cache:',
        '    paths:',
        '      - node_modules/**/*',
      ].join('\n'),
    });
    // Do NOT set cacheConfig in constructor props — use addPropertyOverride.
    amplifyJarvis.addPropertyOverride('CacheConfig.Type', 'AMPLIFY_MANAGED_NO_COOKIES');
    amplifyJarvis.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // ─────────────────────────────────────────────────────────────────────────
    // 9. Amplify — Portfolio app (L1 construct, imported)
    // ─────────────────────────────────────────────────────────────────────────
    const amplifyPortfolio = new amplify.CfnApp(this, 'PortfolioAmplifyApp', {
      name: 'Bruno_Barreto-portfolio',
      platform: 'WEB',
      repository: 'https://github.com/brunobarreto91/pentecost-site',
      iamServiceRole: 'arn:aws:iam::733048624030:role/amplifyconsole-backend-role',
      enableBranchAutoDeletion: false,
      basicAuthConfig: { enableBasicAuth: false },
      customRules: [
        {
          source: '/<*>',
          target: '/index.html',
          status: '404-200',
        },
      ],
      buildSpec: [
        'version: 1',
        'frontend:',
        '  phases:',
        '    build:',
        '      commands: []',
        '  artifacts:',
        '    baseDirectory: /',
        '    files:',
        "      - '**/*'",
        '  cache:',
        '    paths: []',
      ].join('\n'),
    });
    amplifyPortfolio.addPropertyOverride('CacheConfig.Type', 'AMPLIFY_MANAGED_NO_COOKIES');
    amplifyPortfolio.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // Portfolio main branch
    const portfolioMainBranch = new amplify.CfnBranch(this, 'PortfolioAmplifyMainBranch', {
      appId: amplifyPortfolio.attrAppId,
      branchName: 'main',
      stage: 'PRODUCTION',
      enableAutoBuild: true,
      enablePerformanceMode: false,
      enablePullRequestPreview: false,
      environmentVariables: [
        { name: 'AMPLIFY_BACKEND_APP_ID', value: 'do7m1qv1apsq6' },
        { name: 'USER_BRANCH',            value: 'main' },
      ],
    });
    portfolioMainBranch.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // ─────────────────────────────────────────────────────────────────────────
    // 10. CloudFormation Outputs
    //     Output names match the env var keys in client/.env.example
    // ─────────────────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'VITE_AWS_COGNITO_USER_POOL_ID', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID — use as VITE_AWS_COGNITO_USER_POOL_ID in client/.env',
    });

    new cdk.CfnOutput(this, 'VITE_AWS_COGNITO_CLIENT_ID', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito App Client ID — use as VITE_AWS_COGNITO_CLIENT_ID in client/.env',
    });

    new cdk.CfnOutput(this, 'RdsEndpoint', {
      value: rdsInstance.dbInstanceEndpointAddress,
      description: 'RDS MySQL endpoint address',
    });

    new cdk.CfnOutput(this, 'RdsSecretArn', {
      value: rdsSecret.attrId,
      description: 'ARN of the Secrets Manager secret for RDS master password',
    });
  }
}
