import * as pulumi from "@pulumi/pulumi";
import * as s3 from "./aws/s3";

// WEB site
const webS3 = new s3.S3bucket("masu-web", {
  bucketName: "masu-web",
  siteDir: "./app/web/dist",
});

exports.webUrl = webS3.bucket.websiteEndpoint;
