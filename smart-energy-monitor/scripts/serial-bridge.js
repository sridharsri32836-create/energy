const { SerialPort, ReadlineParser } = require('serialport');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Missing Supabase configuration in .env.local');
    console.error('Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 GridSense Serial-to-Supabase Bridge');
console.log(`📡 Target: ${supabaseUrl}`);

const BAUD_RATE = 115200;
const RECONNECT_DELAY = 5000; // 5 seconds
const OFFLINE_TIMEOUT_MS = 15000; // 15 seconds of no data = device offline in DB (simulated)

let port = null;
let parser = null;
let watchdogTimer = null;
let currentBuffer = {};

async function findPort() {
    console.log('🔍 Scanning for Serial Devices...');
    const ports = await SerialPort.list();
    
    // Priority 1: User specified port
    const manualPort = process.argv[2];
    if (manualPort) return manualPort;

    // Priority 2: Common ESP32/Arduino identifiers
    const espPort = ports.find(p => 
        p.manufacturer?.includes('Silicon Labs') || 
        p.manufacturer?.includes('WCH') || 
        p.friendlyName?.includes('USB Serial') ||
        p.pnpId?.includes('USB\\VID_10C4') // Silicon Labs CP210x
    );

    if (espPort) {
        console.log(`✨ Found potential ESP32 on ${espPort.path} (${espPort.manufacturer})`);
        return espPort.path;
    }

    // Priority 3: Fallback to COM3 if it exists and nothing else found
    if (ports.some(p => p.path === 'COM3')) return 'COM3';

    if (ports.length > 0) {
        console.log(`⚠️  No ESP32-specific device found. Trying first available port: ${ports[0].path}`);
        return ports[0].path;
    }

    return null;
}

function startWatchdog() {
    if (watchdogTimer) clearTimeout(watchdogTimer);
    watchdogTimer = setTimeout(() => {
        console.log('\n⏳ No data received for 15s. Device might be disconnected.');
    }, OFFLINE_TIMEOUT_MS);
}

async function uploadToSupabase(data) {
    startWatchdog(); // Reset watchdog on any upload attempt (though we only upload on valid blocks)

    // Glitch filter: PZEM sometimes sends massive values on transient spikes
    if (data.voltage > 400 || data.current > 100) {
        console.warn(`🚫 Glitch rejected: V=${data.voltage} I=${data.current}`);
        return;
    }

    try {
        const { error } = await supabase.from('meter_readings').insert([
            {
                voltage: data.voltage,
                current: data.current,
                power: data.power,
                energy_kwh: data.energy_kwh,
                timestamp: new Date().toISOString()
            }
        ]);

        if (error) {
            console.error(`❌ Supabase Error: ${error.message}`);
        } else {
            process.stdout.write(`✅ [${new Date().toLocaleTimeString()}] V=${data.voltage}V P=${data.power}W\r`);
        }
    } catch (err) {
        console.error(`❌ Network Error: ${err.message}`);
    }
}

async function connect() {
    const portPath = await findPort();

    if (!portPath) {
        console.error('❌ No serial ports found. Retrying in 5s...');
        setTimeout(connect, RECONNECT_DELAY);
        return;
    }

    console.log(`🔌 Connecting to ${portPath}...`);
    
    port = new SerialPort({ path: portPath, baudRate: BAUD_RATE }, (err) => {
        if (err) {
            console.error(`❌ Failed to open ${portPath}: ${err.message}`);
            setTimeout(connect, RECONNECT_DELAY);
        }
    });

    parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    port.on('open', () => {
        console.log(`✅ Connected to ${portPath} at ${BAUD_RATE} baud.`);
        startWatchdog();
    });

    port.on('close', () => {
        console.log('🔌 Port closed. Searching for device again...');
        setTimeout(connect, RECONNECT_DELAY);
    });

    port.on('error', (err) => {
        console.error(`❌ Serial Error: ${err.message}`);
    });

    parser.on('data', (line) => {
        const text = line.trim();
        if (!text) return;

        // Reset watchdog on any activity
        startWatchdog();

        if (text.startsWith('---')) {
            if (currentBuffer.voltage !== undefined && currentBuffer.power !== undefined) {
                uploadToSupabase({
                    voltage: currentBuffer.voltage,
                    current: currentBuffer.current || 0,
                    power: currentBuffer.power,
                    energy_kwh: currentBuffer.energy || 0
                });
            }
            currentBuffer = {};
            return;
        }

        const match = text.match(/^([A-Za-z\s]+):\s*([0-9.]+|nan|NaN)/i);
        if (match) {
            const label = match[1].trim().toLowerCase();
            let value = parseFloat(match[2]);
            if (isNaN(value)) value = 0;

            if (label === 'voltage') currentBuffer.voltage = value;
            else if (label === 'current') currentBuffer.current = value;
            else if (label === 'power') currentBuffer.power = value;
            else if (label === 'energy') currentBuffer.energy = value;
        }
    });
}

// Global error handlers
process.on('uncaughtException', (err) => {
    console.error('🔥 Uncaught Exception:', err.message);
});

connect();
