# AntiADHD on-premises k3s runbook

## Target environment

- Ubuntu Server 24.04 LTS
- Single-node k3s
- Node address: `172.30.1.39`
- Traefik ingress controller
- `local-path` storage class
- Namespace: `antiadhd`

## Architecture

```text
Client
  -> Traefik (172.30.1.39:80)
  -> antiadhd-backend Service
  -> Spring Boot Deployment
  -> antiadhd-postgres Service
  -> PostgreSQL StatefulSet
  -> 20Gi local-path PVC
```

## Render the manifests

```powershell
kubectl kustomize k8s/onprem
```

## Required secrets

The manifests expect the following Secrets in the `antiadhd` namespace:

- `antiadhd-postgres-secret`
  - `POSTGRES_USER`
  - `POSTGRES_PASSWORD`
- `antiadhd-backend-secret`
  - `SPRING_DATASOURCE_USERNAME`
  - `SPRING_DATASOURCE_PASSWORD`
  - `JWT_SECRET`

Do not commit real Secret manifests or decrypted values to Git.

## Current local image workflow

The first home-lab deployment uses a locally built image imported into k3s:

```powershell
docker build -t antiadhd-backend:local -f backend/Dockerfile backend
docker save -o antiadhd-backend-local.tar antiadhd-backend:local
scp antiadhd-backend-local.tar antiadhd@172.30.1.39:/tmp/
ssh antiadhd@172.30.1.39 "sudo k3s ctr images import /tmp/antiadhd-backend-local.tar"
```

This workflow isolates the first cluster deployment from registry and CI/CD
failures. Replace it with immutable GHCR tags and GitHub Actions before calling
the environment production-like.

## Deploy and verify

```powershell
kubectl apply -k k8s/onprem
kubectl rollout status statefulset/antiadhd-postgres -n antiadhd
kubectl rollout status deployment/antiadhd-backend -n antiadhd
kubectl get pods,svc,ingress,pvc -n antiadhd
curl.exe -H "Host: api.antiadhd.local" http://172.30.1.39/actuator/health
```

## Persistence model

PostgreSQL uses a StatefulSet and a `20Gi` `ReadWriteOnce` PVC. The k3s
`local-path` provisioner stores the volume on the node, so Pod recreation does
not delete the database. It does not protect against VM disk loss or node loss.
Backups and restore tests are still required.

## Known transition items

- The on-premises overlay temporarily uses `JPA_DDL_AUTO=update` to bootstrap
  the empty home-lab database.
- Add Flyway migrations, then change this value to `validate`.
- Replace the local image tag with an immutable GHCR tag or digest.
- Add PostgreSQL backup and restore automation.
- Add TLS before exposing the service outside the trusted LAN.
- Keep PostgreSQL as a ClusterIP-only service; do not expose port 5432 publicly.
