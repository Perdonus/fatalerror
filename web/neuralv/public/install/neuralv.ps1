$ErrorActionPreference = 'Stop'

$zipUrl = 'https://raw.githubusercontent.com/Perdonus/fatalerror/windows-builds/windows/neuralv-windows.zip'
$installRoot = Join-Path $env:LOCALAPPDATA 'NeuralV'
$tempRoot = Join-Path $env:TEMP ('neuralv-' + [guid]::NewGuid().ToString('N'))
$zipPath = Join-Path $tempRoot 'neuralv-windows.zip'
$extractRoot = Join-Path $tempRoot 'extract'

New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null
New-Item -ItemType Directory -Force -Path $extractRoot | Out-Null

Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath
Expand-Archive -Path $zipPath -DestinationPath $extractRoot -Force

$payloadRoot = Join-Path $extractRoot 'NeuralV'
if (-not (Test-Path $payloadRoot)) {
  $payloadRoot = $extractRoot
}

New-Item -ItemType Directory -Force -Path $installRoot | Out-Null
Copy-Item -Path (Join-Path $payloadRoot '*') -Destination $installRoot -Recurse -Force

Write-Host 'NeuralV установлен в' $installRoot
