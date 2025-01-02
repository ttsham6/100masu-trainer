import * as pulumi from "@pulumi/pulumi";
import * as network from "./network";
import * as db from "./db";
import * as cluster from "./cluster";

// VPC
const vpc = new network.Vpc("masu");

// DB
const pjDb = new db.Db("masu", {
  subnetIds: vpc.dbSubnetIds,
  securityGroupId: vpc.dbSecurityGroupId,
});

// WEB Cluster
const webCluster = new cluster.Cluster("masu-web", {
  vpcId: vpc.vpcId,
  subnetIds: vpc.webSubnetIds,
  albSgId: vpc.webAlbSecurityGroupId,
  containerSgId: vpc.webSecurityGroupId,
});

// The URL at which the container's HTTP endpoint will be available
export const url = pulumi.interpolate`http://${webCluster.dnsName}`;
