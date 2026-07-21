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

## PostgreSQL backups

The on-prem overlay provisions a separate 10 Gi backup PVC and runs
`antiadhd-postgres-backup` every day at 03:00 Asia/Seoul. Each backup uses
PostgreSQL custom format, is checked with `pg_restore --list`, and is retained
for 14 days.

Run an on-demand backup and prove that it can be restored into an isolated,
temporary database:

```powershell
.\scripts\verify-postgres-backup.ps1
```

The verification job checks restored tables and Flyway history, then drops the
temporary database. The backup PVC is still node-local; copy backups to another
physical machine before treating this as disaster recovery.

Export the latest verified dump to an external disk or another physical machine:

```powershell
.\scripts\export-postgres-backup.ps1 -Destination "E:\AntiADHD-backups"
```

The export command prints a SHA-256 checksum. Keep at least one copy away from
the k3s host, encrypt the destination disk, and test one exported dump quarterly.

## Bootstrap local image workflow

The first home-lab deployment uses a locally built image imported into k3s:

```powershell
docker build -t antiadhd-backend:local -f backend/Dockerfile backend
docker save -o antiadhd-backend-local.tar antiadhd-backend:local
scp antiadhd-backend-local.tar antiadhd@172.30.1.39:/tmp/
ssh antiadhd@172.30.1.39 "sudo k3s ctr images import /tmp/antiadhd-backend-local.tar"
```

This workflow isolates the first cluster deployment from registry and CI/CD
failures.

## GHCR image workflow

`backend-image.yml` verifies the backend and publishes two GHCR tags on pushes
to `main`:

- `sha-<full-git-sha>`: immutable deployment tag
- `main`: moving convenience tag; do not use it for an audited deployment

After the first package publish, make the GHCR package public or configure a
Kubernetes pull Secret with read-only package credentials. Deploy an immutable
tag from the trusted Windows administration machine:

```powershell
.\scripts\deploy-onprem.ps1 -ImageTag sha-<40-character-commit-sha>
```

Preview rendering and authorization without changing the cluster:

```powershell
.\scripts\deploy-onprem.ps1 -ImageTag sha-<40-character-commit-sha> -WhatIf
```

The repository is public, so a persistent self-hosted GitHub Actions runner is
not installed on the k3s node. GitHub warns that pull requests against public
repositories can expose a self-hosted runner to untrusted code. Image publishing
runs on a GitHub-hosted runner; cluster deployment remains a trusted local
operation until a pull-based GitOps controller is introduced.

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

- Flyway owns schema migrations and Hibernate runs with `JPA_DDL_AUTO=validate`.
- The existing home-lab database uses Flyway baseline version `1`; fresh
  databases execute `V1__initial_schema.sql`.
- Use immutable `sha-<full-git-sha>` GHCR tags for deployments.
- Schedule the off-node backup export on the trusted administration computer.
- Add TLS before exposing the service outside the trusted LAN.
- Keep PostgreSQL as a ClusterIP-only service; do not expose port 5432 publicly.
