@echo off
title Automotive Bench 3D — Browser Mode
cd /d "%~dp0"

start /b "" python serve.py >nul 2>&1
timeout /t 1 /nobreak >nul
start "" "http://127.0.0.1:8085/index.html"
