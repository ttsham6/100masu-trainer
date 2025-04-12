import * as pulumi from "@pulumi/pulumi";
import * as s3 from "./aws/s3";

const config = new pulumi.Config();

// WEB site
const webS3 = new s3.S3bucket("masu-web", {
  domainName: config.require("domainName"),
  siteDir: "./app/web/dist",
});

exports.webUrl = webS3.bucket.websiteEndpoint;
