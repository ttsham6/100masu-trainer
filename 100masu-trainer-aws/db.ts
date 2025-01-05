import { rds } from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export interface DbArgs {
  dbName: string;
  dbUser: string;
  dbPassword: pulumi.Output<string>;
  subnetIds: pulumi.Output<string[]>;
  securityGroupId: pulumi.Output<string>;
}

export class Db extends pulumi.ComponentResource {
  public readonly address: pulumi.Output<string>;
  public readonly dbName: pulumi.Output<string>;
  public readonly username: pulumi.Output<string>;
  public readonly password: pulumi.Output<string | undefined>;

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
        dbName: args.dbName,
        allocatedStorage: 20,
        engine: "mysql",
        engineVersion: "8.0.39",
        instanceClass: "db.t3.micro",
        username: args.dbUser,
        password: args.dbPassword,
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [args.securityGroupId],
        skipFinalSnapshot: true,
        tags: { Name: `${pjName}-db` },
      },
      { parent: this }
    );

    this.address = db.address;
    this.dbName = db.dbName;
    this.username = db.username;
    this.password = db.password;
  }
}
