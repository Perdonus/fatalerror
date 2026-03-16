@echo off
setlocal
set "SETUP_URL=https://raw.githubusercontent.com/Perdonus/fatalerror/windows-builds/windows/neuralv-setup.exe"
set "SETUP_PATH=%TEMP%\NeuralVSetup.exe"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri '%SETUP_URL%' -OutFile '%SETUP_PATH%'; Start-Process -FilePath '%SETUP_PATH%' -Wait"
