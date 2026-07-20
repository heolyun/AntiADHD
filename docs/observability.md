# AntiADHD observability

AntiADHD uses `kube-prometheus-stack` chart version `87.17.0` for cluster and
Spring Boot metrics. The chart installs Prometheus Operator, Prometheus,
Alertmanager, Grafana, kube-state-metrics, and node-exporter.

## Capacity policy

- Prometheus: 8 GiB PVC, 7-day retention, 6 GB size limit
- Alertmanager: 2 GiB PVC
- Grafana: 2 GiB PVC
- k3s-incompatible control-plane scrapes are disabled to avoid false alerts

These settings target the single-node 8 GiB home lab. They are not a highly
available monitoring design because the monitoring workloads share the same
node as the application.

## Install or upgrade

Create the Grafana admin Secret without committing its values:

```powershell
kubectl --kubeconfig $HOME/.kube/antiadhd-k3s.yaml create namespace monitoring
kubectl --kubeconfig $HOME/.kube/antiadhd-k3s.yaml -n monitoring create secret generic antiadhd-grafana-admin `
  --from-literal=admin-user=admin `
  --from-literal=admin-password='<strong-password>'
```

Install the pinned Helm chart and then apply the application monitors:

```powershell
helm upgrade --install monitoring prometheus-community/kube-prometheus-stack `
  --version 87.17.0 `
  --namespace monitoring `
  --create-namespace `
  --values k8s/monitoring/kube-prometheus-stack-values.yaml `
  --wait `
  --timeout 10m

kubectl --kubeconfig $HOME/.kube/antiadhd-k3s.yaml apply -k k8s/monitoring
```

Grafana is available on the home LAN at `http://grafana.antiadhd.local` after
the hostname resolves to `172.30.1.39`. Prometheus and Alertmanager do not have
Ingress resources and remain cluster-internal.

## Application metrics

The backend publishes Micrometer metrics at `/actuator/prometheus` and is
discovered through a `ServiceMonitor`. Custom rules cover target availability,
HTTP 5xx ratio, and JVM heap usage. Alert delivery destinations are configured
in a later step; until then, alerts are visible in Alertmanager and Grafana.

The provisioned `AntiADHD Overview` dashboard intentionally defaults to a
15-minute range and 30-second refresh interval. It shows backend availability,
request rate, P95 response time, 5xx ratio, JVM heap, HikariCP connections, and
backend Pod CPU and memory without the query load of the larger cluster
dashboards.
