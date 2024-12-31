from pulumi import Config, Output, export
import pulumi_aws as aws
import pulumi_awsx as awsx


def setup():
    service_name = "masu-web"

    config = Config()
    container_port = config.get_int("containerPort", 80)
    cpu = config.get_int("cpu", 512)
    memory = config.get_int("memory", 128)

    web_cluster = aws.ecs.Cluster(f"{service_name}-cluster")

    web_lb = awsx.lb.ApplicationLoadBalancer(
        f"{service_name}-lb")

    web_repo = awsx.ecr.Repository(
        f"{service_name}-repo", force_delete=True)

    web_image = awsx.ecr.Image(
        f"{service_name}-image",
        repository_url=web_repo.url,
        context="./app/web",
        platform="linux/amd64"
    )

    service = awsx.ecs.FargateService(
        f"{service_name}-service",
        cluster=web_cluster.arn,
        assign_public_ip=True,
        task_definition_args={
            "container": {
                "name": "api",
                "image": web_image.image_uri,
                "cpu": cpu,
                "memory": memory,
                "essential": True,
                "port_mappings": [
                        {
                            "container_port": container_port,
                            "target_group": web_lb.default_target_group,
                        }
                ],
            },
        },
    )

    # The URL at which the container's HTTP endpoint will be available
    export("web-url", Output.concat("http://", web_lb.load_balancer.dns_name))
