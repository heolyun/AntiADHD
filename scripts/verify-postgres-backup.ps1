[CmdletBinding()]
param(
    [string]$Kubeconfig = "$env:USERPROFILE\.kube\antiadhd-k3s.yaml"
)

$ErrorActionPreference = 'Stop'
$namespace = 'antiadhd'
$suffix = Get-Date -Format 'yyyyMMddHHmmss'
$backupJob = "antiadhd-backup-verify-$suffix"
$restoreJob = "antiadhd-restore-verify-$suffix"
$restoreDatabase = "antiadhd_restore_verify_$suffix"
$tempManifest = [IO.Path]::GetTempFileName()
$previousNoProxy = $env:NO_PROXY
$previousLowerNoProxy = $env:no_proxy

try {
    if (-not (Test-Path -LiteralPath $Kubeconfig)) {
        throw "Kubeconfig not found: $Kubeconfig"
    }

    $clusterServer = kubectl --kubeconfig $Kubeconfig config view `
        --minify `
        -o 'jsonpath={.clusters[0].cluster.server}'
    if ($LASTEXITCODE -ne 0 -or -not $clusterServer) {
        throw 'Unable to read the Kubernetes API server from kubeconfig.'
    }

    $clusterHost = ([Uri]$clusterServer).Host
    $noProxyEntries = @($previousNoProxy, $clusterHost, 'localhost', '127.0.0.1') -join ','
    $env:NO_PROXY = $noProxyEntries
    $env:no_proxy = $noProxyEntries

    kubectl --kubeconfig $Kubeconfig -n $namespace create job `
        $backupJob `
        --from=cronjob/antiadhd-postgres-backup | Out-Host
    if ($LASTEXITCODE -ne 0) {
        throw 'Unable to create an on-demand backup Job.'
    }

    kubectl --kubeconfig $Kubeconfig -n $namespace wait `
        --for=condition=complete `
        "job/$backupJob" `
        --timeout=300s | Out-Host
    if ($LASTEXITCODE -ne 0) {
        kubectl --kubeconfig $Kubeconfig -n $namespace logs "job/$backupJob" | Out-Host
        throw 'The on-demand backup Job failed.'
    }
    kubectl --kubeconfig $Kubeconfig -n $namespace logs "job/$backupJob" | Out-Host

    $manifest = @"
apiVersion: batch/v1
kind: Job
metadata:
  name: $restoreJob
  namespace: $namespace
spec:
  backoffLimit: 0
  activeDeadlineSeconds: 600
  ttlSecondsAfterFinished: 600
  template:
    spec:
      restartPolicy: Never
      securityContext:
        fsGroup: 70
        fsGroupChangePolicy: OnRootMismatch
      containers:
        - name: restore-verify
          image: postgres:16-alpine
          env:
            - name: PGHOST
              value: antiadhd-postgres
            - name: PGUSER
              valueFrom:
                secretKeyRef:
                  name: antiadhd-postgres-secret
                  key: POSTGRES_USER
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: antiadhd-postgres-secret
                  key: POSTGRES_PASSWORD
            - name: RESTORE_DATABASE
              value: $restoreDatabase
          command:
            - /bin/sh
            - -ec
            - |
              latest=`$(find /backups -type f -name 'antiadhd-*.dump' | sort | tail -n 1)
              test -n "`$latest"
              cleanup() { dropdb --if-exists "`$RESTORE_DATABASE"; }
              trap cleanup EXIT
              cleanup
              createdb "`$RESTORE_DATABASE"
              pg_restore --exit-on-error --no-owner --no-privileges --dbname="`$RESTORE_DATABASE" "`$latest"
              table_count=`$(psql --dbname="`$RESTORE_DATABASE" --tuples-only --no-align --command="select count(*) from information_schema.tables where table_schema = 'public';")
              migration_count=`$(psql --dbname="`$RESTORE_DATABASE" --tuples-only --no-align --command='select count(*) from flyway_schema_history where success;')
              test "`$table_count" -gt 0
              test "`$migration_count" -gt 0
              echo "Restore verified from `$latest: `$table_count tables, `$migration_count successful migrations"
          resources:
            requests:
              cpu: 50m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
          volumeMounts:
            - name: backups
              mountPath: /backups
              readOnly: true
      volumes:
        - name: backups
          persistentVolumeClaim:
            claimName: antiadhd-postgres-backups
"@
    [IO.File]::WriteAllText($tempManifest, $manifest, (New-Object Text.UTF8Encoding($false)))

    kubectl --kubeconfig $Kubeconfig apply -f $tempManifest | Out-Host
    if ($LASTEXITCODE -ne 0) {
        throw 'Unable to create the restore verification Job.'
    }

    kubectl --kubeconfig $Kubeconfig -n $namespace wait `
        --for=condition=complete `
        "job/$restoreJob" `
        --timeout=300s | Out-Host
    if ($LASTEXITCODE -ne 0) {
        kubectl --kubeconfig $Kubeconfig -n $namespace logs "job/$restoreJob" | Out-Host
        throw 'Restore verification failed.'
    }
    kubectl --kubeconfig $Kubeconfig -n $namespace logs "job/$restoreJob" | Out-Host
}
finally {
    $env:NO_PROXY = $previousNoProxy
    $env:no_proxy = $previousLowerNoProxy
    if (Test-Path -LiteralPath $tempManifest) {
        [IO.File]::Delete($tempManifest)
    }
}
