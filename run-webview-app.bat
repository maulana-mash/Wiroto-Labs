@echo off
title Automotive Bench 3D — Windows Standalone App
cd /d "%~dp0"

start /b "" python serve.py >nul 2>&1
timeout /t 1 /nobreak >nul

where msedge >nul 2>&1
if %errorlevel%==0 (
    start "" msedge --app="http://127.0.0.1:8085/index.html" --window-size=1440,900
    exit /b 0
)

where chrome >nul 2>&1
if %errorlevel%==0 (
    start "" chrome --app="http://127.0.0.1:8085/index.html" --window-size=1440,900
    exit /b 0
)

start "" "http://127.0.0.1:8085/index.html"
