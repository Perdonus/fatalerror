$ErrorActionPreference = 'Stop'
$setupUrl = 'https://raw.githubusercontent.com/Perdonus/fatalerror/windows-builds/windows/neuralv-setup.exe'
$tempPath = Join-Path $env:TEMP 'NeuralVSetup.exe'
Invoke-WebRequest -Uri $setupUrl -OutFile $tempPath
Start-Process -FilePath $tempPath -Wait
