@echo off
title Askrindo SATU - Sistem Aplikasi Terpadu
echo ==========================================================
echo       MEMULAI ASKRINDO SATU - SISTEM APLIKASI TERPADU
echo ==========================================================
echo.
echo Menjalankan server lokal Askrindo SATU di port 8080...
echo Membuka aplikasi di peramban web default Anda...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Gagal menjalankan server lokal. Membuka index.html secara langsung...
    start "" "%~dp0index.html"
)
pause
