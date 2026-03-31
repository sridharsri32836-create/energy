import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { detectSpike } from '@/lib/spikeDetector'
import { calculateCost } from '@/lib/costCalculator'

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

        const supabase = createServiceClient()

        // 1. Insert meter reading
        const { error: readingError } = await supabase.from('meter_readings').insert({
            voltage,
            current,
            power,
            energy_kwh,
            timestamp: timestamp ?? new Date().toISOString(),
        })

        if (readingError) throw readingError

        // 2. Get recent readings for anomaly detection (ascending = oldest first, newest last)
        const { data: recentData } = await supabase
            .from('meter_readings')
            .select('voltage, current, power')
            .order('timestamp', { ascending: true })
            .limit(20)

        // 3. Detect spikes — pass ascending recentData, pf, and timestamp
        const spikes = detectSpike(
            { voltage, current, power, pf },
            recentData ?? [],
            undefined,
            timestamp ?? new Date().toISOString(),
        )

        // 4. Insert alerts for each spike
        if (spikes.length > 0) {
            const alertInserts = spikes.map((s) => ({
                alert_type: s.alertType!,
                value: s.value!,
                message: s.message!,
                timestamp: timestamp ?? new Date().toISOString(),
            }))
            await supabase.from('alerts').insert(alertInserts)
        }

        // 5. Upsert daily_usage aggregate
        const dateStr = (timestamp ? new Date(timestamp) : new Date()).toISOString().split('T')[0]
        const tariffRate = 6 // default; can be overridden via env later

        // Get current day total
        const { data: existingDay } = await supabase
            .from('daily_usage')
            .select('total_energy_kwh')
            .eq('date', dateStr)
            .single()

        const newTotal = (existingDay?.total_energy_kwh ?? 0) + energy_kwh
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

