import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { detectSpike } from '@/lib/spikeDetector'
import { calculateCost } from '@/lib/costCalculator'
import { sendAlertEmail, sendAlertSMS } from '@/lib/notifications'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { voltage, current, power, energy_kwh, timestamp, pf: bodyPf } = body

        // Validate required fields
        if (voltage == null || current == null || power == null || energy_kwh == null) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Use measured PF from ESP32 if available, otherwise compute from V/I/P
        const apparent = voltage * current
        const computedPf = apparent > 0 ? Math.min(1, power / apparent) : undefined
        const pf = bodyPf != null ? bodyPf : computedPf

        // Filter out impossible hardware glitches (UART noise or sensor bug upon reconnect)
        if (voltage > 350 || current > 100 || power > 35000) {
            console.warn(`Ignoring impossible sensor reading: V=${voltage}, I=${current}, P=${power}`);
            return NextResponse.json({ success: false, error: 'Ignored hardware glitch reading' }, { status: 200 });
        }

        const supabase = createServiceClient()

        // 1. Fetch recent readings BEFORE inserting — so the spike detector sees the true
        //    previous state (e.g. 245V) rather than the current 0V we're about to insert.
        const { data: recentRaw } = await supabase
            .from('meter_readings')
            .select('voltage, current, power, timestamp')
            .order('timestamp', { ascending: false })
            .limit(20)
        const recentData = (recentRaw ?? []).reverse()

        // 2. Detect spikes against the pre-insert history
        const spikes = detectSpike(
            { voltage, current, power, pf },
            recentData,
            undefined,
            timestamp ?? new Date().toISOString(),
        )

        // 3. Insert meter reading
        const { error: readingError } = await supabase.from('meter_readings').insert({
            voltage,
            current,
            power,
            energy_kwh,
            timestamp: timestamp ?? new Date().toISOString(),
        })

        if (readingError) throw readingError

        // 4. Insert alerts for each spike — deduplicate outage alerts within 60 seconds to stop spam
        if (spikes.length > 0) {
            // Check when the last outage alert was inserted (prevents rapid-fire duplicates)
            const hasOutage = spikes.some(s => s.alertType === 'ANOMALY' && s.message?.includes('outage'))
            let suppressOutage = false
            if (hasOutage) {
                const sixtySecondsAgo = new Date(Date.now() - 60_000).toISOString()
                const { data: recentOutage } = await supabase
                    .from('alerts')
                    .select('id')
                    .eq('alert_type', 'ANOMALY')
                    .ilike('message', '%outage%')
                    .gte('timestamp', sixtySecondsAgo)
                    .limit(1)
                if (recentOutage && recentOutage.length > 0) suppressOutage = true
            }

            const filteredSpikes = suppressOutage
                ? spikes.filter(s => !(s.alertType === 'ANOMALY' && s.message?.includes('outage')))
                : spikes

            if (filteredSpikes.length === 0) {
                return NextResponse.json({ success: true, alerts_created: 0 }, { status: 201 })
            }

            const alertInserts = filteredSpikes.map((s) => ({
                alert_type: s.alertType!,
                value: s.value!,
                message: s.message!,
                timestamp: timestamp ?? new Date().toISOString(),
            }))
            await supabase.from('alerts').insert(alertInserts)

            // Fetch users who opted in for alerts
            const { data: userSettings } = await supabase
                .from('user_settings')
                .select('*')
                .or('send_email_alerts.eq.true,send_sms_alerts.eq.true')

            // Trigger Email & SMS Notifications non-blockingly for high/med severity events
            filteredSpikes.forEach(spike => {
                if (spike.severity === 'HIGH' || spike.severity === 'MEDIUM') {
                    console.log(`[Readings API] Notifying for ${spike.severity} alert: ${spike.alertType}`);
                    
                    // Send to global targets from .env (fallback)
                    sendAlertEmail(spike.alertType ?? 'UNKNOWN', spike.severity ?? 'UNKNOWN', spike.message ?? '')
                        .catch(err => console.error('Global Email error:', err))
                    sendAlertSMS(spike.alertType ?? 'UNKNOWN', spike.severity ?? 'UNKNOWN', spike.message ?? '')
                        .catch(err => console.error('Global SMS error:', err))

                    // Send to customized user settings
                    userSettings?.forEach(setting => {
                        if (setting.send_email_alerts && setting.alert_email) {
                            sendAlertEmail(spike.alertType ?? 'UNKNOWN', spike.severity ?? 'UNKNOWN', spike.message ?? '', setting.alert_email as string)
                                .catch(err => console.error('User Email error:', err))
                        }
                        if (setting.send_sms_alerts && setting.alert_phone) {
                            sendAlertSMS(spike.alertType ?? 'UNKNOWN', spike.severity ?? 'UNKNOWN', spike.message ?? '', setting.alert_phone as string)
                                .catch(err => console.error('User SMS error:', err))
                        }
                    })
                }
            })
        }

        // 5. Upsert daily_usage aggregate
        const dateStr = (timestamp ? new Date(timestamp) : new Date()).toISOString().split('T')[0]
        const tariffRate = 6 // ₹ per kWh - can be fetched from config later
        
        let energyDelta = 0;
        if (recentData && recentData.length > 0) {
            const lastReading = recentData[recentData.length - 1];
            const now = timestamp ? new Date(timestamp).getTime() : Date.now();
            const lastTime = new Date(lastReading.timestamp).getTime();
            const msDiff = now - lastTime;
            
            // If the last reading was within 10 minutes, calculate Pavg * Δt
            if (msDiff > 0 && msDiff < 10 * 60 * 1000) {
                // Average power in kW * hours elapsed
                const avgPowerKw = ((power + lastReading.power) / 2) / 1000;
                const hours = msDiff / 3600000;
                energyDelta = avgPowerKw * hours;
            }
        }


        // Use .select() instead of .single() to avoid 406 error when row is missing
        const { data: dayRows } = await supabase
            .from('daily_usage')
            .select('total_energy_kwh')
            .eq('date', dateStr)
            .limit(1)

        const existingTotal = dayRows && dayRows.length > 0 ? dayRows[0].total_energy_kwh : 0
        const newTotal = existingTotal + energyDelta
        
        await supabase.from('daily_usage').upsert({
            date: dateStr,
            total_energy_kwh: newTotal,
            estimated_cost: calculateCost(newTotal, tariffRate),
        })

        return NextResponse.json({
            success: true,
            alerts_created: spikes.length,
        }, { status: 201 })

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const limit = parseInt(searchParams.get('limit') ?? '60')

        const supabase = createServiceClient()
        const { data, error } = await supabase
            .from('meter_readings')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(limit)

        if (error) throw error

        return NextResponse.json({ data: data.reverse() })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

export async function DELETE() {
    try {
        const supabase = createServiceClient()
        // neq filter ensures all rows are matched
        const { error } = await supabase
            .from('meter_readings')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000')

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

