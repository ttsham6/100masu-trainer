import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface ApigatewayArgs {
  lbArn: pulumi.Output<string>;
  dnsName: pulumi.Output<string>;
}

export class Apigateway extends pulumi.ComponentResource {
  // public readonly apiGateway: aws.apigatewayv2.Api;

  constructor(
    serviceName: string,
    args: ApigatewayArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super(`custom:resource:Apigateway`, serviceName, args, opts);

    const api = new aws.apigateway.RestApi(
      `${serviceName}-api`,
      {
        description: "API Gateway for API Service",
        endpointConfiguration: {
          types: "REGIONAL",
        },
      },
      { parent: this }
    );

    const resource = new aws.apigateway.Resource(
      `${serviceName}-resource`,
      {
        restApi: api.id,
        parentId: api.rootResourceId,
        pathPart: "rank",
      },
      { parent: this }
    );

    const method = new aws.apigateway.Method(
      `${serviceName}-get-method`,
      {
        restApi: api.id,
        resourceId: resource.id,
        httpMethod: "POST",
        authorization: "NONE",
      },
      { parent: this }
    );

    const vpcLink = new aws.apigateway.VpcLink(
      `${serviceName}-vpc-link`,
      {
        targetArn: args.lbArn,
      },
      { parent: this }
    );

    const integrationNlb = new aws.apigateway.Integration(
      `${serviceName}-integration-nlb`,
      {
        restApi: api.id,
        resourceId: resource.id,
        httpMethod: method.httpMethod,
        type: "HTTP_PROXY",
        connectionType: "VPC_LINK",
        connectionId: vpcLink.id,
        integrationHttpMethod: "POST",
        uri: pulumi.interpolate`http://${args.dnsName}/rank`,
      },
      { parent: this }
    );

    const deployment = new aws.apigateway.Deployment(
      `${serviceName}-deployment`,
      {
        restApi: api.id,
        description: "Deployment for the API Gateway",
      },
      { parent: this, dependsOn: [integrationNlb] }
    );
  }
}
