import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export interface Route53Args {
  domainName: string;
  usEast1Provider: aws.Provider;
}

export class Route53 extends pulumi.ComponentResource {
  public readonly domainName: pulumi.Output<string>;
  public readonly hostedZoneId: pulumi.Output<string>;
  public readonly certificationArn: pulumi.Output<string>;

  constructor(
    serviceName: string,
    args: Route53Args,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super(`custom:resource:Route53`, serviceName, args, opts);

    // Public Hosted Zone
    const roodHostedZone = new aws.route53.Zone(
      `${serviceName}-public-hosted-zone`,
      {
        name: args.domainName,
        forceDestroy: true,
      },
      { parent: this }
    );

    // ACM証明書
    const cert = new aws.acm.Certificate(
      "cert",
      {
        domainName: args.domainName,
        subjectAlternativeNames: [`*.${args.domainName}`],
        validationMethod: "DNS",
      },
      {
        provider: args.usEast1Provider,
      }
    );

    const certValidationRecords = cert.domainValidationOptions.apply((dvos) =>
      dvos.map(
        (dvo, index) =>
          new aws.route53.Record(`certValidation-${index}`, {
            name: dvo.resourceRecordName,
            records: [dvo.resourceRecordValue],
            ttl: 60,
            type: dvo.resourceRecordType,
            zoneId: roodHostedZone.id,
            allowOverwrite: true,
          })
      )
    );

    this.domainName = roodHostedZone.name;
    this.hostedZoneId = roodHostedZone.id;
    this.certificationArn = cert.arn;
  }
}
