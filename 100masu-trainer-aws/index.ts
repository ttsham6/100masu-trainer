import * as pulumi from "@pulumi/pulumi";
import * as s3 from "./aws/s3";
import * as route53 from "./aws/route53";
import * as aws from "@pulumi/aws";

const config = new pulumi.Config();

// WEB site
const webS3 = new s3.S3bucket("masu-web", {
  domainName: config.require("domainName"),
  siteDir: "./app/web/dist",
});

const usEast1Provider = new aws.Provider("us-east-1", {
  region: "us-east-1",
});

// Route53
const route53service = new route53.Route53("masu-web", {
  domainName: config.require("domainName"),
  usEast1Provider,
});
