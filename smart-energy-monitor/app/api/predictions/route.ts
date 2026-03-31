import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { generatePredictions } from '@/lib/predictions'

export async function GET() {
    try {
        const supabase = createServiceClient()
        const { data, error } = await supabase
            .from('predictions')
            .select('*')
            .order('date', { ascending: true })
            .limit(7)

        if (error) throw error
        return NextResponse.json({ data })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}))
        const tariffRate = body.tariffRate ?? 6

        const supabase = createServiceClient()

        // Get last 30 days of daily usage
        const { data: dailyData, error: dailyError } = await supabase
            .from('daily_usage')
            .select('*')
            .order('date', { ascending: true })
            .limit(30)

        if (dailyError) throw dailyError

        if (!dailyData || dailyData.length < 3) {
            return NextResponse.json({ error: 'Not enough data for predictions (need at least 3 days)' }, { status: 422 })
        }

        const predictions = generatePredictions(dailyData, tariffRate)

        // Upsert predictions
        const { error: upsertError } = await supabase
            .from('predictions')
            .upsert(predictions, { onConflict: 'date' })

        if (upsertError) throw upsertError

        return NextResponse.json({ data: predictions })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

export async function DELETE() {
    try {
        const supabase = createServiceClient()
        const { error } = await supabase
            .from('predictions')
            .delete()
            .neq('date', '1970-01-01')

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

