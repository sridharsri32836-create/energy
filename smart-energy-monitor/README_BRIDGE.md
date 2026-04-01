# 🚀 GridSense Serial Bridge Instructions

This bridge connects your ESP32 hardware to the **live website** (Vercel) by sending data directly to Supabase.

### 🔌 How to use:
1. **Connect your ESP32** to your laptop via USB.
2. **Close Arduino IDE Serial Monitor** (if open) to allow the bridge to access the port.
3. double-click the **`Start-Bridge.bat`** file in the project folder.

### 💡 Features:
- **Auto-detection**: It will automatically find your ESP32 port.
- **Direct-to-Cloud**: Works with the deployed Vercel site without needing to run the website locally.
- **Auto-reconnect**: If you unplug the ESP32, it will wait and reconnect automatically when you plug it back in.

### 🛠️ Troubleshooting:
- If the window says "No serial ports found", check your USB connection.
- Ensure no other software (like Arduino IDE) is currently using the COM port.
