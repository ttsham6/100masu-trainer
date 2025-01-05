import * as pulumi from "@pulumi/pulumi";
import * as network from "./network";
import * as db from "./db";
import * as cluster from "./cluster";

const config = new pulumi.Config();

// VPC
const vpc = new network.Vpc("masu");

// DB
const pjDb = new db.Db("masu", {
  dbName: "masu_db",
  dbUser: "app",
  dbPassword: config.requireSecret("dbPassword"),
  subnetIds: vpc.dbSubnetIds,
  securityGroupId: vpc.dbSecurityGroupId,
});

// Api
const apiCluster = new cluster.Cluster("masu-api", {
  clusterName: "ApiCluster",
  assignPublicIp: false,
  vpcId: vpc.vpcId,
  subnetIds: vpc.apiSubnetIds,
  albSgId: vpc.apiAlbSecurityGroupId,
  containerSgId: vpc.apiSecurityGroupId,
  contextPath: "./app/api",
  heatlthCheckPath: "/actuator/health",
  environments: [
    { name: "DB_HOST", value: pjDb.address },
    { name: "DB_NAME", value: pjDb.dbName },
    { name: "DB_USER", value: pjDb.username },
    { name: "DB_PASSWORD", value: pjDb.password },
    { name: "SPRING_PROFILES_ACTIVE", value: config.get("environment") },
  ],
});

// WEB Cluster
const webCluster = new cluster.Cluster("masu-web", {
  clusterName: "WebCluster",
  assignPublicIp: true,
  vpcId: vpc.vpcId,
  subnetIds: vpc.webSubnetIds,
  albSgId: vpc.webAlbSecurityGroupId,
  containerSgId: vpc.webSecurityGroupId,
  contextPath: "./app/web",
  environments: [],
});

// The URL at which the container's HTTP endpoint will be available
export const url = pulumi.interpolate`http://${webCluster.dnsName}`;
