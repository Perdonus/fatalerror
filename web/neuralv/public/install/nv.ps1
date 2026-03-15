param(
  [ValidateSet("install", "update", "uninstall")]
  [string]$Action = "install"
)

$ErrorActionPreference = "Stop"

$baseUrl = if ($env:NEURALV_BASE_URL) { $env:NEURALV_BASE_URL.TrimEnd("/") } else { "https://sosiskibot.ru" }
$manifestUrl = if ($env:NEURALV_MANIFEST_URL) { $env:NEURALV_MANIFEST_URL } else { "$baseUrl/basedata/api/releases/manifest" }
$installRoot = if ($env:NV_INSTALL_ROOT) { $env:NV_INSTALL_ROOT } else { Join-Path $env:LOCALAPPDATA "NeuralV\bin" }
$targetPath = Join-Path $installRoot "nv.exe"

function Ensure-PathEntry {
  param([string]$PathEntry)

  $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
  if (-not $currentPath) {
    [Environment]::SetEnvironmentVariable("Path", $PathEntry, "User")
    return
  }

  $parts = $currentPath.Split(';') | Where-Object { $_ -and $_.Trim() }
  if ($parts -contains $PathEntry) {
    return
  }

  [Environment]::SetEnvironmentVariable("Path", "$currentPath;$PathEntry", "User")
}

function Resolve-NvUrl {
  $manifest = Invoke-RestMethod -Uri $manifestUrl -Headers @{ Accept = "application/json" }
  $artifacts = @()

  if ($manifest.artifacts) {
    $artifacts = $manifest.artifacts
  } elseif ($manifest.manifest -and $manifest.manifest.artifacts) {
    $artifacts = $manifest.manifest.artifacts
  }

  $windowsArtifact = $artifacts | Where-Object { "$($_.platform)".ToLower() -eq "windows" } | Select-Object -First 1
  if (-not $windowsArtifact) {
    throw "Windows artifact is missing in release manifest."
  }

  $metadata = $windowsArtifact.metadata
  if ($metadata -and $metadata.nvDownloadUrl) {
    return [string]$metadata.nvDownloadUrl
  }

  throw "Windows nv payload is missing in release manifest."
}

switch ($Action) {
  "install" {
    New-Item -ItemType Directory -Force -Path $installRoot | Out-Null
    $nvUrl = Resolve-NvUrl
    Invoke-WebRequest -Uri $nvUrl -OutFile $targetPath
    Ensure-PathEntry -PathEntry $installRoot
    Write-Host "Installed nv to $targetPath"
    Write-Host "Next:"
    Write-Host "  nv install neuralv@latest"
    Write-Host "  nv -v"
  }
  "update" {
    & $PSCommandPath -Action install
  }
  "uninstall" {
    if (Test-Path $targetPath) {
      Remove-Item -Force $targetPath
    }
    Write-Host "Removed nv from $installRoot"
  }
}
