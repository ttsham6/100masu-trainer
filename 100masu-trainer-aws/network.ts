import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export class Vpc extends pulumi.ComponentResource {
  // VPC
  public readonly vpcId: pulumi.Output<string>;
  // Subnets
  public readonly webSubnetIds: pulumi.Output<string[]>;
  public readonly apiSubnetIds: pulumi.Output<string[]>;
  public readonly dbSubnetIds: pulumi.Output<string[]>;
  // Security Groups
  public readonly webAlbSecurityGroupId: pulumi.Output<string>;
  public readonly webSecurityGroupId: pulumi.Output<string>;
  public readonly apiAlbSecurityGroupId: pulumi.Output<string>;
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

    // Route Table
    const routeTable = new aws.ec2.RouteTable(
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

    // Route Table association
    const subnetIds = [...webSubnets, ...apiSubnets, ...dbSubnets];
    for (let i = 0; i < subnetIds.length; i++) {
      const _ = new aws.ec2.RouteTableAssociation(
        `${pjName}-rt-assoc-${i}`,
        {
          routeTableId: routeTable.id,
          subnetId: subnetIds[i].id,
        },
        { parent: this }
      );
    }

    // Security Group
    const webAlbSg = new aws.ec2.SecurityGroup(
      `${pjName}-alb-sg`,
      {
        vpcId: vpc.id,
        tags: { Name: `${pjName}-alb-sg` },
      },
      { parent: this }
    );
    const webAlbSgIngres = new aws.vpc.SecurityGroupIngressRule(
      `${pjName}-alb-sg-ingress`,
      {
        securityGroupId: webAlbSg.id,
        ipProtocol: "tcp",
        fromPort: 80,
        toPort: 80,
        cidrIpv4: "0.0.0.0/0",
      },
      { parent: this }
    );

    const webSg = new aws.ec2.SecurityGroup(
      `${pjName}-web-sg`,
      {
        vpcId: vpc.id,
        tags: { Name: `${pjName}-web-sg` },
      },
      { parent: this }
    );
    const webSgIngress = new aws.vpc.SecurityGroupIngressRule(
      `${pjName}-web-sg-ingress`,
      {
        referencedSecurityGroupId: webAlbSg.id,
        securityGroupId: webSg.id,
        ipProtocol: "tcp",
        toPort: 80,
      },
      { parent: this }
    );

    const apiAlbSg = new aws.ec2.SecurityGroup(
      `${pjName}-api-alb-sg`,
      {
        vpcId: vpc.id,
        tags: { Name: `${pjName}-api-alb-sg` },
      },
      { parent: this }
    );
    const apiAlbSgIngress = new aws.vpc.SecurityGroupIngressRule(
      `${pjName}-api-alb-sg-ingress`,
      {
        securityGroupId: apiAlbSg.id,
        referencedSecurityGroupId: webSg.id,
        ipProtocol: "tcp",
        fromPort: 80,
      },
      { parent: this }
    );

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
        referencedSecurityGroupId: apiAlbSg.id,
        ipProtocol: "tcp",
        toPort: 80,
      },
      { parent: this }
    );

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
        toPort: 3306,
      },
      {
        parent: this,
      }
    );

    // Set Outputs
    this.vpcId = vpc.id;
    this.webSubnetIds = pulumi.output(webSubnets.map((s) => s.id));
    this.apiSubnetIds = pulumi.output(apiSubnets.map((s) => s.id));
    this.dbSubnetIds = pulumi.output(dbSubnets.map((s) => s.id));
    this.webAlbSecurityGroupId = webAlbSg.id;
    this.webSecurityGroupId = webSg.id;
    this.apiAlbSecurityGroupId = apiAlbSg.id;
    this.apiSecurityGroupId = apiSecurityGroup.id;
    this.dbSecurityGroupId = dbSecurityGroup.id;

    this.registerOutputs({});
  }
}
