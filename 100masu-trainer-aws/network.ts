import * as aws from "@pulumi/aws";
import { SecurityGroupIngressRule } from "@pulumi/aws/vpc";
import * as pulumi from "@pulumi/pulumi";

export class Vpc extends pulumi.ComponentResource {
  // VPC
  public readonly vpcId: pulumi.Output<string>;
  // Subnets
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly apiSubnetIds: pulumi.Output<string[]>;
  public readonly dbSubnetIds: pulumi.Output<string[]>;
  // Security Groups
  public readonly apiSecurityGroupId: pulumi.Output<string>;
  public readonly dbSecurityGroupId: pulumi.Output<string>;

  constructor(pjName: string, opts?: pulumi.ComponentResourceOptions) {
    super("custom:resource:VPC", pjName, {}, opts);

    // VPC
    const vpc = new aws.ec2.Vpc(
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
    const igw = new aws.ec2.InternetGateway(
      `${pjName}-igw`,
      {
        vpcId: vpc.id,
        tags: { Name: `${pjName}-igw` },
      },
      { parent: this }
    );

    // Subnets
    const publicSubnets = [
      new aws.ec2.Subnet(
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
      new aws.ec2.Subnet(
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
      new aws.ec2.Subnet(
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
      new aws.ec2.Subnet(
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
      new aws.ec2.Subnet(
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
      new aws.ec2.Subnet(
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

    // Nat Gateway
    const eip = new aws.ec2.Eip(`${pjName}-eip`, {}, { parent: this });
    const natGateway = new aws.ec2.NatGateway(
      `${pjName}-nat-gateway`,
      {
        allocationId: eip.id,
        subnetId: publicSubnets[0].id,
        tags: { Name: `${pjName}-nat-gateway` },
      },
      { parent: this, dependsOn: [igw] }
    );

    // Route Table
    const publicRouteTable = new aws.ec2.RouteTable(
      `${pjName}-public-route-table`,
      {
        vpcId: vpc.id,
        routes: [{ cidrBlock: "0.0.0.0/0", gatewayId: igw.id }],
        tags: { Name: `${pjName}-public-route-table` },
      },
      { parent: this }
    );

    const privateRouteTable = new aws.ec2.RouteTable(
      `${pjName}-private-route-table`,
      {
        vpcId: vpc.id,
        routes: [{ cidrBlock: "0.0.0.0/0", natGatewayId: natGateway.id }],
        tags: { Name: `${pjName}-private-route-table` },
      },
      { parent: this }
    );

    // Route Table association
    for (let i = 0; i < publicSubnets.length; i++) {
      const _ = new aws.ec2.RouteTableAssociation(
        `${pjName}-public-rt-assoc-${i}`,
        {
          routeTableId: publicRouteTable.id,
          subnetId: publicSubnets[i].id,
        },
        { parent: this }
      );
    }

    const subnetIds = [...apiSubnets, ...dbSubnets];
    for (let i = 0; i < subnetIds.length; i++) {
      const _ = new aws.ec2.RouteTableAssociation(
        `${pjName}-private-rt-assoc-${i}`,
        {
          routeTableId: privateRouteTable.id,
          subnetId: subnetIds[i].id,
        },
        { parent: this }
      );
    }

    // Security Group
    const apiSecurityGroup = new aws.ec2.SecurityGroup(
      `${pjName}-api-sg`,
      {
        vpcId: vpc.id,
        tags: { Name: `${pjName}-api-sg` },
      },
      { parent: this }
    );
    const apiSecurityGroupIngress = new aws.vpc.SecurityGroupIngressRule(
      `${pjName}-api-sg-ingress`,
      {
        securityGroupId: apiSecurityGroup.id,
        cidrIpv4: "10.0.0.128/25",
        ipProtocol: "tcp",
        fromPort: 80,
        toPort: 80,
      },
      { parent: this }
    );
    setAllAllowEgressRule(apiSecurityGroup.id, `${pjName}-api-sg`, this);

    const dbSecurityGroup = new aws.ec2.SecurityGroup(
      `${pjName}-db-sg`,
      {
        vpcId: vpc.id,
        tags: { Name: `${pjName}-db-sg` },
      },
      { parent: this }
    );
    const dbSecurityGroupIngress = new aws.vpc.SecurityGroupIngressRule(
      `${pjName}-db-sg-ingress`,
      {
        securityGroupId: dbSecurityGroup.id,
        referencedSecurityGroupId: apiSecurityGroup.id,
        ipProtocol: "tcp",
        fromPort: 3306,
        toPort: 3306,
      },
      {
        parent: this,
      }
    );
    setAllAllowEgressRule(dbSecurityGroup.id, `${pjName}-db-sg`, this);

    // Set Outputs
    this.vpcId = vpc.id;
    this.publicSubnetIds = pulumi.output(publicSubnets.map((s) => s.id));
    this.apiSubnetIds = pulumi.output(apiSubnets.map((s) => s.id));
    this.dbSubnetIds = pulumi.output(dbSubnets.map((s) => s.id));
    this.apiSecurityGroupId = apiSecurityGroup.id;
    this.dbSecurityGroupId = dbSecurityGroup.id;

    this.registerOutputs({});
  }
}

function setAllAllowEgressRule(
  sgId: pulumi.Output<string>,
  sgName: string,
  parent: pulumi.ComponentResource
) {
  const allAllowEgress = new aws.vpc.SecurityGroupEgressRule(
    `${sgName}-all-allow-egress`,
    {
      securityGroupId: sgId,
      cidrIpv4: "0.0.0.0/0",
      ipProtocol: "-1",
      fromPort: -1,
      toPort: -1,
    },
    { parent }
  );
}
