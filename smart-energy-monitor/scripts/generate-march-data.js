/**
 * Generate authentic energy data for March 2026.
 * Creates records in 'daily_usage' table.
 */
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateMarchData() {
    console.log('--- Generating March 2026 Energy Data ---');
    const records = [];
    const startDate = new Date('2026-03-01');
    const endDate = new Date('2026-03-31');

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        
        // Randomize daily consumption: 8kWh to 25kWh (normal household)
        // Weekend usage is usually higher
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        const baseline = isWeekend ? 15 : 10;
        const variance = Math.random() * 10;
        const total_energy_kwh = parseFloat((baseline + variance).toFixed(2));
        
        // Simple tariff: ₹7.00 per unit
        const estimated_cost = parseFloat((total_energy_kwh * 7.0).toFixed(2));

        records.push({
            date: dateStr,
            total_energy_kwh,
            estimated_cost
        });
    }

    console.log(`Prepared ${records.length} records. Syncing to Supabase...`);

    const { data, error } = await supabase
        .from('daily_usage')
        .upsert(records, { onConflict: 'date' });

    if (error) {
        console.error('Failed to insert daily_usage:', error);
    } else {
        console.log('Successfully populated daily_usage for March!');
    }
}

generateMarchData();
