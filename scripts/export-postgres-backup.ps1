[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Destination,
    [string]$Kubeconfig = "$env:USERPROFILE\.kube\antiadhd-k3s.yaml"
)

$ErrorActionPreference = 'Stop'
$namespace = 'antiadhd'
$pod = "antiadhd-backup-export-$(Get-Date -Format 'yyyyMMddHHmmss')"
$tempManifest = [IO.Path]::GetTempFileName()

try {
    if (-not (Test-Path -LiteralPath $Kubeconfig)) {
        throw "Kubeconfig not found: $Kubeconfig"
    }

    New-Item -ItemType Directory -Force -Path $Destination | Out-Null
    $resolvedDestination = (Resolve-Path -LiteralPath $Destination).Path

    $manifest = @"
apiVersion: v1
kind: Pod
metadata:
  name: $pod
  namespace: $namespace
spec:
  restartPolicy: Never
  containers:
    - name: export
      image: postgres:16-alpine
      command: ["/bin/sh", "-c", "sleep 600"]
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
    if ($LASTEXITCODE -ne 0) { throw 'Unable to create backup export Pod.' }
    kubectl --kubeconfig $Kubeconfig -n $namespace wait --for=condition=Ready "pod/$pod" --timeout=120s | Out-Host
    if ($LASTEXITCODE -ne 0) { throw 'Backup export Pod did not become ready.' }

    $remote = kubectl --kubeconfig $Kubeconfig -n $namespace exec $pod -- `
        sh -c "find /backups -type f -name 'antiadhd-*.dump' | sort | tail -n 1"
    if ($LASTEXITCODE -ne 0 -or -not $remote) { throw 'No PostgreSQL backup was found.' }

    $fileName = Split-Path -Leaf $remote.Trim()
    $localFile = Join-Path $resolvedDestination $fileName
    kubectl --kubeconfig $Kubeconfig -n $namespace cp "${pod}:$($remote.Trim())" $localFile | Out-Host
    if ($LASTEXITCODE -ne 0) { throw 'Unable to copy the PostgreSQL backup.' }

    $hash = Get-FileHash -Algorithm SHA256 -LiteralPath $localFile
    Write-Output "Exported: $localFile"
    Write-Output "SHA256: $($hash.Hash)"
}
finally {
    kubectl --kubeconfig $Kubeconfig -n $namespace delete pod $pod --ignore-not-found --wait=false 2>$null | Out-Null
    if (Test-Path -LiteralPath $tempManifest) {
        [IO.File]::Delete($tempManifest)
    }
}
