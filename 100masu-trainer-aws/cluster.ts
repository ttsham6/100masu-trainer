import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import * as awsx from "@pulumi/awsx";

export interface ClusterArgs {
  clusterName: string;
  vpcId: pulumi.Output<string>;
  subnetIds: pulumi.Output<string[]>;
  albSgId: pulumi.Output<string>;
  containerSgId: pulumi.Output<string>;
  contextPath: string;
  heatlthCheckPath?: string;
  environments: Object[];
}

export class Cluster extends pulumi.ComponentResource {
  public readonly dnsName: pulumi.Output<string>;

  constructor(
    serviceName: string,
    args: ClusterArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super(`custom:resource:${args.clusterName}`, serviceName, args, opts);

    const config = new pulumi.Config();
    const containerPort = config.getNumber("containerPort") || 80;
    const cpu = config.getNumber("cpu") || 256;
    const memory = config.getNumber("memory") || 128;

    // An ECS cluster to deploy into
    const cluster = new aws.ecs.Cluster(
      `${serviceName}-cluster`,
      {},
      { parent: this }
    );

    // An ALB to serve the container endpoint to the internet
    const loadbalancer = new awsx.lb.ApplicationLoadBalancer(
      `${serviceName}-lb`,
      {
        subnetIds: args.subnetIds,
        securityGroups: [args.albSgId],
        defaultTargetGroup: {
          port: containerPort,
          healthCheck: {
            enabled: true,
            path: args.heatlthCheckPath || "/",
            port: `${containerPort}`,
            protocol: "http",
            timeout: 10,
          },
        },
      },
      { parent: this }
    );

    // An ECR repository to store our application's container image
    const repo = new awsx.ecr.Repository(
      `${serviceName}-repo`,
      { forceDelete: true },
      { parent: this }
    );

    // Build and publish our application's container image to the ECR repository
    const image = new awsx.ecr.Image(
      `${serviceName}-image`,
      {
        repositoryUrl: repo.url,
        context: args.contextPath,
        platform: "linux/amd64",
      },
      { parent: this }
    );

    // Deploy an ECS Service on Fargate to host the application container
    const service = new awsx.ecs.FargateService(
      `${serviceName}-service`,
      {
        cluster: cluster.arn,
        taskDefinitionArgs: {
          container: {
            name: "app",
            image: image.imageUri,
            cpu: cpu,
            memory: memory,
            memoryReservation: 256,
            essential: true,
            portMappings: [
              {
                containerPort: containerPort,
                targetGroup: loadbalancer.defaultTargetGroup,
              },
            ],
            environment: args.environments,
          },
        },
        networkConfiguration: {
          assignPublicIp: true,
          subnets: args.subnetIds,
          securityGroups: [args.containerSgId],
        },
        desiredCount: 1,
      },
      { parent: this }
    );

    // Set member variables for this component
    this.dnsName = loadbalancer.loadBalancer.dnsName;
  }
}
