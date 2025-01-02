import { ec2 } from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export class Vpc extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly webSubnetIds: pulumi.Output<string[]>;
  public readonly apiSubnetIds: pulumi.Output<string[]>;
  public readonly dbSubnetIds: pulumi.Output<string[]>;

  constructor(pjName: string, opts?: pulumi.ComponentResourceOptions) {
    super("custom:resource:VPC", pjName, {}, opts);

    // VPC
    const vpc = new ec2.Vpc(
      `${pjName}-vpc`,
      {
        cidrBlock: "10.0.0.0/22",
        instanceTenancy: "default",
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: { Name: `${pjName}-vpc` },
      },
      { parent: this }
    );

    // Internet Gateway
    const igw = new ec2.InternetGateway(
      `${pjName}-igw`,
      {
        vpcId: vpc.id,
        tags: { Name: `${pjName}-igw` },
      },
      { parent: this }
    );

    // Route Table
    const routeTable = new ec2.RouteTable(
      `${pjName}-route-table`,
      {
        vpcId: vpc.id,
        routes: [{ cidrBlock: "0.0.0.0/0", gatewayId: igw.id }],
        tags: { Name: `${pjName}-route-table` },
      },
      { parent: this }
    );

    // Subnets
    const webSubnets = [
      new ec2.Subnet(
        `${pjName}-web-1a-subnet`,
        {
          vpcId: vpc.id,
          cidrBlock: "10.0.0.0/26",
          availabilityZone: "ap-northeast-1a",
          mapPublicIpOnLaunch: true,
          tags: { Name: `${pjName}-web-1a-subnet` },
        },
        { parent: this }
      ),
      new ec2.Subnet(
        `${pjName}-web-1c-subnet`,
        {
          vpcId: vpc.id,
          cidrBlock: "10.0.0.64/26",
          availabilityZone: "ap-northeast-1c",
          mapPublicIpOnLaunch: true,
          tags: { Name: `${pjName}-web-1c-subnet` },
        },
        { parent: this }
      ),
    ];

    const apiSubnets = [
      new ec2.Subnet(
        `${pjName}-api-1a-subnet`,
        {
          vpcId: vpc.id,
          cidrBlock: "10.0.0.128/26",
          availabilityZone: "ap-northeast-1a",
          mapPublicIpOnLaunch: false,
          tags: { Name: `${pjName}-api-1a-subnet` },
        },
        { parent: this }
      ),
      new ec2.Subnet(
        `${pjName}-api-1c-subnet`,
        {
          vpcId: vpc.id,
          cidrBlock: "10.0.0.192/26",
          availabilityZone: "ap-northeast-1c",
          mapPublicIpOnLaunch: false,
          tags: { Name: `${pjName}-api-1c-subnet` },
        },
        { parent: this }
      ),
    ];

    const dbSubnets = [
      new ec2.Subnet(
        `${pjName}-db-1a-subnet`,
        {
          vpcId: vpc.id,
          cidrBlock: "10.0.1.0/26",
          availabilityZone: "ap-northeast-1a",
          mapPublicIpOnLaunch: false,
          tags: { Name: `${pjName}-db-1a-subnet` },
        },
        { parent: this }
      ),
      new ec2.Subnet(
        `${pjName}-db-1c-subnet`,
        {
          vpcId: vpc.id,
          cidrBlock: "10.0.1.64/26",
          availabilityZone: "ap-northeast-1c",
          mapPublicIpOnLaunch: false,
          tags: { Name: `${pjName}-db-1c-subnet` },
        },
        { parent: this }
      ),
    ];

    // Route Table association
    const subnetIds = [...webSubnets, ...apiSubnets, ...dbSubnets];
    for (let i = 0; i < subnetIds.length; i++) {
      const _ = new ec2.RouteTableAssociation(
        `${pjName}-rt-assoc-${i}`,
        {
          routeTableId: routeTable.id,
          subnetId: subnetIds[i].id,
        },
        { parent: this }
      );
    }

    // Set Outputs
    this.vpcId = vpc.id;
    this.webSubnetIds = pulumi.output(webSubnets.map((s) => s.id));
    this.apiSubnetIds = pulumi.output(apiSubnets.map((s) => s.id));
    this.dbSubnetIds = pulumi.output(dbSubnets.map((s) => s.id));

    this.registerOutputs({});
  }
}
