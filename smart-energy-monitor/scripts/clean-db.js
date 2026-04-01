const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
for (const k in envConfig) {
    process.env[k] = envConfig[k];
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanDB() {
    console.log('Cleaning fake spikes...');

    // 1. Delete impossible meter readings
    const { data: readings, error: err1 } = await supabase
        .from('meter_readings')
        .delete()
        .or('voltage.gt.350,current.gt.100,power.gt.35000');
    console.log('Deleted readings (>350V or >100A):', err1 ? err1.message : 'Success');

    // 2. Clear corrupted daily usage
    // We can just reset total_energy_kwh for today to 0 to be safe, or delete it
    const today = new Date().toISOString().split('T')[0];
    const { data: usage, error: err2 } = await supabase
        .from('daily_usage')
        .update({ total_energy_kwh: 0, estimated_cost: 0 })
        .eq('date', today);
    console.log('Reset today usage to 0:', err2 ? err2.message : 'Success');

    // 3. Delete those fake alerts
    const { data: alerts, error: err3 } = await supabase
        .from('alerts')
        .delete()
        .like('message', '%3042%') // just in case
        
    const { data: alerts2, error: err4 } = await supabase
        .from('alerts')
        .delete()
        .or('message.ilike.%379895%,message.ilike.%3042%');
    console.log('Deleted fake alerts:', err4 ? err4.message : 'Success');

    // Or a more aggressive delete of impossible alerts
    const { data: allAlerts } = await supabase.from('alerts').select('*');
    if (allAlerts) {
        for (const a of allAlerts) {
            if (a.value > 400 && a.alert_type === 'VOLTAGE_SPIKE') {
                await supabase.from('alerts').delete().eq('id', a.id);
            }
            if (a.value > 100 && a.alert_type === 'CURRENT_SURGE') {
                await supabase.from('alerts').delete().eq('id', a.id);
            }
            if (a.value > 50000 && a.alert_type === 'ANOMALY') {
                await supabase.from('alerts').delete().eq('id', a.id);
            }
            // Clear out some specifically large fake values by looking at message
            if (a.value > 3000) {
                 await supabase.from('alerts').delete().eq('id', a.id);
            }
        }
        console.log('Deleted high-value fake alerts manually.');
    }
}

cleanDB();
