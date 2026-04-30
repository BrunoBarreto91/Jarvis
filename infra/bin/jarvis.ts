#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { JarvisStack } from '../lib/jarvis-stack';

const app = new cdk.App();

new JarvisStack(app, 'JarvisStack', {
  env: {
    account: '733048624030',
    region: 'us-east-1',
  },
  description: 'Jarvis infrastructure — EC2 n8n, RDS MySQL, Cognito, Amplify',
});
