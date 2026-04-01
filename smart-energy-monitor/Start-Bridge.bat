@echo off
TITLE GridSense Serial Bridge (DEPRECATED)
echo ==========================================================
echo ⚠️ WARNING: THIS SCRIPT IS DEPRECATED ⚠️
echo The Smart Energy Monitor now supports direct Web Serial connections!
echo Open the website in Chrome/Edge, click "Connect Hardware", 
echo and select your ESP32. You no longer need to run this file.
echo.
echo Running in FALLBACK mode just in case...
echo ==========================================================
echo.
echo 🚀 Starting GridSense Serial-to-Supabase Bridge...
echo 📡 Connecting your ESP32 to the Cloud...
echo.
node scripts/serial-bridge.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Bridge stopped with error.
    pause
)
echo.
pause
