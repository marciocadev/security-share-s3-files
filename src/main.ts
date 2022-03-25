import { App, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { AwsIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Bucket, IBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    const securityBucket = new Bucket(this, 'SecurityBucket', {
      bucketName: 'security-bucket-access-with-cdk',
      publicReadAccess: false,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const bucketRest = new RestApi(this, 'BucketRest', {
      restApiName: 'security-share-s3-files',
      // field that enables API Gateway to handle binary media types.
      // If the API needs to serve anything other than a text payload, this is required.
      // binaryMediaTypes: ['application/octet-stream', 'image/jpeg'],
      binaryMediaTypes: ['*/*'],
      //  a field that enables compression of your content and specifies
      // the minimum size of payload that has to be compressed
      minimumCompressionSize: 0,
    });

    const resourceFolder = bucketRest.root.addResource('assets').addResource('{folder}');
    const resourceKey = resourceFolder.addResource('{key}');
    resourceKey.addMethod('GET', this.getFileIntegration(securityBucket), {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Content-Type': true,
          },
        },
      ],
      requestParameters: {
        'method.request.path.folder': true,
        'method.request.path.key': true,
        'method.request.header.Content-Type': true,
      },
    });
    resourceKey.addMethod('PUT', this.putFileIntegration(securityBucket), {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Content-Type': true,
          },
        },
      ],
      requestParameters: {
        'method.request.path.folder': true,
        'method.request.path.key': true,
        'method.request.header.Content-Type': true,
      },
    });
  }

  // Put Object
  private putFileIntegration(bucket: IBucket) {
    const putRole = new Role(this, 'BucketPutRole', {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
      roleName: 'bucket-put-role',
    });
    putRole.addToPolicy(new PolicyStatement({
      resources: [bucket.bucketArn],
      actions: ['s3:PutObject'],
    }));
    bucket.grantWrite(putRole);

    return new AwsIntegration({
      service: 's3',
      integrationHttpMethod: 'PUT',
      path: `${bucket.bucketName}/{folder}/{key}`,
      options: {
        credentialsRole: putRole,
        integrationResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Content-Type': 'integration.response.header.Content-Type',
            },
          },
        ],
        requestParameters: {
          'integration.request.path.folder': 'method.request.path.folder',
          'integration.request.path.key': 'method.request.path.key',
          // 'integration.request.header.Accept': 'method.request.header.Accept',
        },
      },
    });
  }

  // GetObject Method
  private getFileIntegration(bucket: IBucket) {
    const getRole = new Role(this, 'BucketGetRole', {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
      roleName: 'bucket-get-role',
    });
    getRole.addToPolicy(new PolicyStatement({
      resources: [bucket.bucketArn],
      actions: ['s3:GetObject'],
    }));
    bucket.grantRead(getRole);

    return new AwsIntegration({
      service: 's3',
      integrationHttpMethod: 'GET',
      path: `${bucket.bucketName}/{folder}/{key}`,
      options: {
        credentialsRole: getRole,
        integrationResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Content-Type': 'integration.response.header.Content-Type',
            },
          },
        ],
        requestParameters: {
          'integration.request.path.folder': 'method.request.path.folder',
          'integration.request.path.key': 'method.request.path.key',
          // 'integration.request.header.Accept': 'method.request.header.Accept',
        },
      },
    });
  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, 'security-share-s3-files-dev', { env: devEnv });
// new MyStack(app, 'security-share-s3-files-prod', { env: prodEnv });

app.synth();