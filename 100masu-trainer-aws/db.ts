import { rds } from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export interface DbArgs {
  subnetIds: pulumi.Output<string[]>;
  securityGroupId: pulumi.Output<string>;
}

export class Db extends pulumi.ComponentResource {
  public readonly address: pulumi.Output<string>;
  public readonly dbName: pulumi.Output<string>;
  public readonly dbUser: pulumi.Output<string>;

  constructor(
    pjName: string,
    args: DbArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("custom:resource:Db", pjName, args, opts);

    // Db Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(
      `${pjName}-db-subnet-group`,
      {
        subnetIds: args.subnetIds,
        tags: { Name: `${pjName}-db-subnet-group` },
      },
      { parent: this }
    );

    // Db Instance
    const db = new rds.Instance(
      `${pjName}-db`,
      {
        dbName: "masudb",
        allocatedStorage: 20,
        engine: "mysql",
        engineVersion: "8.0.39",
        instanceClass: "db.t3.micro",
        username: "admin",
        manageMasterUserPassword: true,
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [args.securityGroupId],
        tags: { Name: `${pjName}-db` },
      },
      { parent: this }
    );

    this.address = db.address;
    this.dbName = db.dbName;
    this.dbUser = db.username;
  }
}
