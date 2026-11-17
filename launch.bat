@echo off
title Automotive Bench 3D — Launcher
cd /d "%~dp0"
cls
echo ============================================================
echo   AUTOMOTIVE BENCH 3D - TRAINER KELISTRIKAN BODI OTOMOTIF
echo ============================================================
echo.
echo   [1] Jalankan sebagai Aplikasi Desktop Mandiri (WebView App)
echo   [2] Jalankan di Web Browser Standar (Chrome / Edge)
echo   [3] Jalankan Pengujian Otomatis (Unit Tests)
echo   [4] Keluar
echo.
set /p choice="Pilih menu (1-4): "

if "%choice%"=="1" call run-webview-app.bat
if "%choice%"=="2" call run-browser.bat
if "%choice%"=="3" (
    node --test tests/*.test.js
    pause
)
exit /b 0
