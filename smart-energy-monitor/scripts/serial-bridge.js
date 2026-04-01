const { SerialPort, ReadlineParser } = require('serialport');

const portPath = process.argv[2];
const apiUrl = process.argv[3] || 'http://localhost:3000/api/readings';

if (!portPath) {
    console.error('Usage: node scripts/serial-bridge.js <COM_PORT> [API_URL]');
    console.error('Example: node scripts/serial-bridge.js COM3');
    process.exit(1);
}

console.log(`[bridge] Listening on ${portPath}...`);
console.log(`[bridge] Forwarding data to ${apiUrl}...`);

const port = new SerialPort({
    path: portPath,
    baudRate: 115200,
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

// ── Watchdog: if no data arrives for this many ms, send a 0V outage reading ──
const SILENCE_TIMEOUT_MS = 12000; // 12 seconds
let silenceTimer = null;
let deviceOnline = false;

function resetSilenceTimer() {
    if (silenceTimer) clearTimeout(silenceTimer);
    silenceTimer = setTimeout(async () => {
        if (!deviceOnline) return; // Already offline, don't spam
        deviceOnline = false;
        console.log('\n[bridge] ⏱️  No data for 12s — sending power outage (0V) reading...');
        try {
            const res = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ voltage: 0, current: 0, power: 0, energy_kwh: 0 }),
            });
            if (res.ok) console.log('[bridge] ✅ Outage reading uploaded.');
            else console.error(`[bridge] ❌ Outage upload failed: ${res.status}`);
        } catch (err) {
            console.error(`[bridge] ❌ Network error sending outage: ${err.message}`);
        }
    }, SILENCE_TIMEOUT_MS);
}

port.on('open', () => {
    console.log(`[bridge] ✅ Successfully connected to ${portPath}`);
    deviceOnline = true;
    resetSilenceTimer(); // Start watchdog
});

port.on('error', (err) => {
    console.error(`[bridge] Serial Error: ${err.message}`);
});

// Accumulator: the ESP32 sends one value per line, separated by "---"
let buffer = {};

async function uploadReading(data) {
    // ── Hardware glitch filter: reject impossible physics ──
    if (data.voltage > 350 || data.current > 100 || data.power > 35000) {
        console.warn(`[bridge] 🚫 Rejected hardware glitch: V=${data.voltage} I=${data.current} P=${data.power}`);
        return;
    }

    console.log(`\n[bridge] 📦 Parsed — V=${data.voltage}V  I=${data.current}A  P=${data.power}W  E=${data.energy_kwh.toFixed(4)}kWh${data.pf != null ? `  PF=${data.pf}` : ''}`);

    try {
        const res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (res.ok) {
            console.log(`[bridge] ✅ Uploaded successfully.`);
        } else {
            const errJson = await res.json().catch(() => ({}));
            console.error(`[bridge] ❌ Upload failed: ${res.status} ${errJson.error || ''}`);
        }
    } catch (err) {
        console.error(`[bridge] ❌ Network error: ${err.message}`);
    }
}

parser.on('data', async (line) => {
    const text = line.trim();
    if (!text) return;

    // Any data arriving means the device is alive — reset watchdog
    resetSilenceTimer();
    if (!deviceOnline) {
        deviceOnline = true;
        console.log('[bridge] 🔆 Device came back online!');
    }

    // Detect the separator line (e.g. "-------------------")
    if (text.startsWith('---')) {
        // Only upload if we have the required fields
        if (buffer.voltage != null && buffer.current != null && buffer.power != null) {
            const data = {
                voltage:    buffer.voltage,
                current:    buffer.current,
                power:      buffer.power,
                energy_kwh: buffer.energy ?? (buffer.power / 1000) * (5 / 3600),
                ...(buffer.pf        != null && { pf: buffer.pf }),
                ...(buffer.frequency != null && { frequency: buffer.frequency }),
            };

            await uploadReading(data);
        } else if (Object.keys(buffer).length > 0) {
            console.warn(`[bridge] ⚠️  Incomplete block — missing fields, skipping. Got: ${JSON.stringify(buffer)}`);
        }

        // Reset the buffer for the next block
        buffer = {};
        return;
    }

    // Parse "Label: ValueUnit" lines
    // Handles normal numbers AND nan/-nan/NaN (PZEM outputs nan when disconnected)
    const match = text.match(/^([A-Za-z\s]+):\s*([0-9.]+|nan|-nan|NaN)/i);
    if (!match) {
        // Not a parseable line (could be a header or garbage), skip silently
        return;
    }

    const label = match[1].trim().toLowerCase();
    let value = parseFloat(match[2]);
    if (isNaN(value)) {
        value = 0; // Treat disconnected 'nan' as 0
    }

    if (label === 'voltage')        buffer.voltage   = value;
    else if (label === 'current')   buffer.current   = value;
    else if (label === 'power')     buffer.power     = value;
    else if (label === 'energy')    buffer.energy    = value;
    else if (label === 'frequency') buffer.frequency = value;
    else if (label === 'pf')        buffer.pf        = value;
});
