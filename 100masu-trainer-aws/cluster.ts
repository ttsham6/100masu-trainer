import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import * as awsx from "@pulumi/awsx";

export class Cluster extends pulumi.ComponentResource {
  public readonly dnsName: pulumi.Output<string>;

  constructor(serviceNAme: string, opts?: pulumi.ComponentResourceOptions) {
    super("custom:resource:Cluster", serviceNAme, {}, opts); // TODO: arg設定

    const config = new pulumi.Config();
    const containerPort = config.getNumber("containerPort") || 80;
    const cpu = config.getNumber("cpu") || 256;
    const memory = config.getNumber("memory") || 128;

    // An ECS cluster to deploy into
    const cluster = new aws.ecs.Cluster(`${serviceNAme}-cluster`, {});

    // An ALB to serve the container endpoint to the internet
    const loadbalancer = new awsx.lb.ApplicationLoadBalancer(
      `${serviceNAme}-lb`,
      {}
    );

    // An ECR repository to store our application's container image
    const repo = new awsx.ecr.Repository(`${serviceNAme}-repo`, {
      forceDelete: true,
    });

    // Build and publish our application's container image from ./app to the ECR repository
    const image = new awsx.ecr.Image(`${serviceNAme}-image`, {
      repositoryUrl: repo.url,
      context: "./app/web",
      platform: "linux/amd64",
    });

    // Deploy an ECS Service on Fargate to host the application container
    const service = new awsx.ecs.FargateService(`${serviceNAme}-service`, {
      cluster: cluster.arn,
      assignPublicIp: true,
      taskDefinitionArgs: {
        container: {
          name: "app",
          image: image.imageUri,
          cpu: cpu,
          memory: memory,
          essential: true,
          portMappings: [
            {
              containerPort: containerPort,
              targetGroup: loadbalancer.defaultTargetGroup,
            },
          ],
        },
      },
    });

    // Set member variables for this component
    this.dnsName = loadbalancer.loadBalancer.dnsName;
  }
}
