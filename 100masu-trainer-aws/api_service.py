from pulumi import Config, Output, export
import pulumi_aws as aws
import pulumi_awsx as awsx


def setup():
    service_name = "masu-trainer-api"

    config = Config()
    container_port = config.get_int("containerPort", 80)
    cpu = config.get_int("cpu", 512)
    memory = config.get_int("memory", 128)

    api_cluster = aws.ecs.Cluster("cluster")

    api_lb = awsx.lb.ApplicationLoadBalancer(f"{service_name}-loadbalancer")

    api_repo = awsx.ecr.Repository(f"{service_name}-repo", force_delete=True)

    api_image = awsx.ecr.Image(
        f"{service_name}-image",
        repository_url=api_repo.url,
        context="./tmp/api",
        platform="linux/amd64"
    )

    service = awsx.ecs.FargateService(
        f"{service_name}-service",
        cluster=api_cluster.arn,
        assign_public_ip=False,
        task_definition_args={
            "container": {
                "name": "api",
                "image": api_image.image_uri,
                "cpu": cpu,
                "memory": memory,
                "essential": True,
                "port_mappings": [
                        {
                            "container_port": container_port,
                            "target_group": api_lb.default_target_group,
                        }
                ],
            },
        },
    )

    # The URL at which the container's HTTP endpoint will be available
    export("api-url", Output.concat("http://", api_lb.load_balancer.dns_name))
