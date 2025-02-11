import * as pulumi from "@pulumi/pulumi";
import * as network from "./network";
import * as db from "./db";
import * as cluster from "./cluster";
import * as s3 from "./s3";
import * as apigateway from "./apigateway";

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

// API
const apiCluster = new cluster.Cluster("masu-api", {
  clusterName: "ApiCluster",
  assignPublicIp: false,
  vpcId: vpc.vpcId,
  subnetIds: vpc.apiSubnetIds,
  containerSgId: vpc.apiSecurityGroupId,
  contextPath: "./app/api",
  healthCheckPath: "/actuator/health",
  environments: [
    { name: "DB_HOST", value: pjDb.address },
    { name: "DB_NAME", value: pjDb.dbName },
    { name: "DB_USER", value: pjDb.username },
    { name: "DB_PASSWORD", value: pjDb.password },
    { name: "SPRING_PROFILES_ACTIVE", value: config.get("environment") },
  ],
});

// API Gateway
const apiGateway = new apigateway.Apigateway("masu", {
  dnsName: apiCluster.dnsName,
  lbArn: apiCluster.lbArn,
});

// WEB site
const webS3 = new s3.S3bucket("masu-web", {
  bucketName: "masu-web",
  siteDir: "./app/web/dist",
});

exports.webUrl = webS3.bucket.websiteEndpoint;
