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

port.on('open', () => {
    console.log(`[bridge] ✅ Successfully connected to ${portPath}`);
});

port.on('error', (err) => {
    console.error(`[bridge] Serial Error: ${err.message}`);
});

// Accumulator: the ESP32 sends one value per line, separated by "---"
// We collect values here and flush when we see the separator
let buffer = {};

parser.on('data', async (line) => {
    const text = line.trim();
    if (!text) return;

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
        } else if (Object.keys(buffer).length > 0) {
            console.warn(`[bridge] ⚠️  Incomplete block — missing fields, skipping. Got: ${JSON.stringify(buffer)}`);
        }

        // Reset the buffer for the next block
        buffer = {};
        return;
    }

    // Parse "Label: ValueUnit" lines
    // e.g. "Voltage: 239.50V" → label="Voltage", num=239.50
    const match = text.match(/^([A-Za-z\s]+):\s*([\d.]+)/);
    if (!match) {
        // Not a parseable line (could be a header or garbage), skip silently
        return;
    }

    const label = match[1].trim().toLowerCase();
    const value = parseFloat(match[2]);

    if (label === 'voltage')   buffer.voltage   = value;
    else if (label === 'current')   buffer.current   = value;
    else if (label === 'power')     buffer.power     = value;
    else if (label === 'energy')    buffer.energy    = value;
    else if (label === 'frequency') buffer.frequency = value; // stored but not sent to API
    else if (label === 'pf')        buffer.pf        = value; // stored but not sent to API
});
