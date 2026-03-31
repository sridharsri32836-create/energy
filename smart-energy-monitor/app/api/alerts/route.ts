import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const limit = parseInt(searchParams.get('limit') ?? '20')
        const onlyUnread = searchParams.get('unread') === 'true'

        const supabase = createServiceClient()
        let query = supabase
            .from('alerts')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(limit)

        if (onlyUnread) query = query.eq('is_read', false)

        const { data, error } = await query
        if (error) throw error

        return NextResponse.json({ data })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
