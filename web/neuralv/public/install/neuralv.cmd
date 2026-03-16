@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -Command "irm https://sosiskibot.ru/neuralv/install/neuralv.ps1 | iex"
endlocal
