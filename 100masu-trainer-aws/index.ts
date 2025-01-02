import * as pulumi from "@pulumi/pulumi";
import * as cluster from "./cluster";
import * as network from "./network";

// VPC
const vpc = new network.Vpc("masu-network");

// WEB Cluster
const webCluster = new cluster.Cluster("masu-web");

// The URL at which the container's HTTP endpoint will be available
export const url = pulumi.interpolate`http://${webCluster.dnsName}`;
