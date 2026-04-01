@echo off
TITLE GridSense Serial Bridge
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
