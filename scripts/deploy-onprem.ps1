[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'High')]
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^sha-[0-9a-f]{40}$')]
    [string]$ImageTag,

    [string]$Kubeconfig = "$env:USERPROFILE\.kube\antiadhd-k3s.yaml"
)

$ErrorActionPreference = 'Stop'
$image = "ghcr.io/heolyun/antiadhd-backend:$ImageTag"
$overlay = Join-Path $PSScriptRoot '..\k8s\onprem'
$tempManifest = [IO.Path]::GetTempFileName()

try {
    if (-not (Test-Path -LiteralPath $Kubeconfig)) {
        throw "Kubeconfig not found: $Kubeconfig"
    }

    kubectl --kubeconfig $Kubeconfig auth can-i patch deployments -n antiadhd | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw 'Unable to authorize against the AntiADHD cluster.'
    }

    $rendered = kubectl kustomize $overlay
    if ($LASTEXITCODE -ne 0) {
        throw 'Kustomize rendering failed.'
    }

    $sourceImage = 'image: antiadhd-backend:local'
    $replacement = "image: $image"
    $matches = ([regex]::Matches(($rendered -join "`n"), [regex]::Escape($sourceImage))).Count
    if ($matches -ne 1) {
        throw "Expected one backend image placeholder, found $matches."
    }

    $manifest = ($rendered -join "`n").Replace($sourceImage, $replacement)
    [IO.File]::WriteAllText(
        $tempManifest,
        $manifest,
        (New-Object Text.UTF8Encoding($false))
    )

    if (-not $PSCmdlet.ShouldProcess('antiadhd/antiadhd-backend', "Deploy $image")) {
        Write-Host "Rendered deployment for $image; no cluster changes were made."
        return
    }

    kubectl --kubeconfig $Kubeconfig apply -f $tempManifest
    if ($LASTEXITCODE -ne 0) {
        throw 'Kubernetes apply failed.'
    }

    kubectl --kubeconfig $Kubeconfig rollout status `
        deployment/antiadhd-backend `
        -n antiadhd `
        --timeout=300s
    if ($LASTEXITCODE -ne 0) {
        throw 'Backend rollout failed.'
    }

    curl.exe --fail --silent --show-error `
        -H 'Host: api.antiadhd.local' `
        http://172.30.1.39/actuator/health
    if ($LASTEXITCODE -ne 0) {
        throw 'Ingress health check failed.'
    }

    Write-Host "`nDeployed $image"
}
finally {
    if (Test-Path -LiteralPath $tempManifest) {
        [IO.File]::Delete($tempManifest)
    }
}
