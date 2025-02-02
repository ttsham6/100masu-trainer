import * as pulumi from "@pulumi/pulumi";
import * as network from "./network";
import * as db from "./db";
import * as cluster from "./cluster";
import * as s3 from "./s3";

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

// WEB site
const webS3 = new s3.S3bucket("masu-web", {
  bucketName: "masu-web",
  siteDir: "./app/web/dist",
});

exports.webUrl = webS3.bucket.websiteEndpoint;
