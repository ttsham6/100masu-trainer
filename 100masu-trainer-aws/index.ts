import * as pulumi from "@pulumi/pulumi";
import * as cluster from "./cluster";

// WEB Cluster
const webCluster = new cluster.Cluster("mas-web");

// The URL at which the container's HTTP endpoint will be available
export const url = pulumi.interpolate`http://${webCluster.dnsName}`;
