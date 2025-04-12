import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import * as mime from "mime-lite";
import * as fs from "fs";
import * as path from "path";

export interface S3bucketArgs {
  domainName: string;
  siteDir: string;
}

export class S3bucket extends pulumi.ComponentResource {
  public readonly bucket: aws.s3.Bucket;

  constructor(
    serviceName: string,
    args: S3bucketArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super(`custom:resource:WebSiteBucket`, serviceName, args, opts);

    // S3 bucket
    const siteBucket = new aws.s3.Bucket(
      `${serviceName}-web-bucket`,
      {
        bucket: args.domainName,
        website: {
          indexDocument: "index.html",
          // errorDocument: "error.html", // TODO: add error page
        },
      },
      { parent: this }
    );

    new aws.s3.BucketPolicy(
      `${serviceName}-web-bucket-policy`,
      {
        bucket: siteBucket.bucket,
        policy: siteBucket.bucket.apply((bucket) => {
          return JSON.stringify({
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Principal: "*",
                Action: "s3:GetObject",
                Resource: `arn:aws:s3:::${bucket}/*`,
              },
            ],
          });
        }),
      },
      { parent: this }
    );

    // Upload all files in the siteDir to the S3 bucket
    const addFolderContents = (
      s3bucket: aws.s3.Bucket,
      siteDir: string,
      prefix: string
    ) => {
      fs.readdirSync(siteDir).forEach((item) => {
        const filePath = path.join(siteDir, item);

        if (fs.lstatSync(filePath).isDirectory()) {
          const newPrefix = prefix ? path.join(prefix, item) : item;
          addFolderContents(s3bucket, filePath, newPrefix);
          return;
        }

        let itemPath = prefix ? path.join(prefix, item) : item;
        itemPath = itemPath.replace(/\\/g, "/"); // convert Windows paths to something S3 will recognize

        new aws.s3.BucketObject(
          itemPath,
          {
            bucket: s3bucket,
            source: new pulumi.asset.FileAsset(filePath),
            contentType: mime.getType(filePath) || undefined,
          },
          { parent: this }
        );
      });
    };

    addFolderContents(siteBucket, args.siteDir, "");

    // Expose a website index document
    new aws.s3.BucketPublicAccessBlock(
      `${serviceName}-web-access-block`,
      {
        bucket: siteBucket.id,
        blockPublicAcls: false,
      },
      { parent: this }
    );
    this.bucket = siteBucket;
  }
}
