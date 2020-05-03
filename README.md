# Description

A Http API to send message to service bus via `@azure/service-bus` library

## Guide to setup:

1) Fill in value in `values.dev.yaml` for `AZURE_SERVICEBUS_CONNECTION_STRING`. **Note:** Make sure service bus namespace has queue name: taskEmail created.

2) There is 2 ways to deploy to minikube: *Note*: Create namespace name `core` in K8s
    - Skaffold command: `skaffold run` (Docker image will build automatically)

    - Helm command: `helm install helm-chart/ --namespace core --name http-sender-amqp` (Need to build docker image first : `docker build -t http-sender-amqp .`)

3) After deployment done obtain base URL for the service by running command: `minikube service -n core http-sender-amqp `


## Endpoints specs:

- `GET /liveness` - For k8s cluster to check health endpoint

- `POST /task` - Send message to service bus