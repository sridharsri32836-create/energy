import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const days = parseInt(searchParams.get('days') ?? '30')

        const supabase = createServiceClient()
        const { data, error } = await supabase
            .from('daily_usage')
            .select('*')
            .order('date', { ascending: false })
            .limit(days)

        if (error) throw error

        return NextResponse.json({ data })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

export async function DELETE() {
    try {
        const supabase = createServiceClient()
        const { error } = await supabase
            .from('daily_usage')
            .delete()
            .neq('date', '1970-01-01')

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

