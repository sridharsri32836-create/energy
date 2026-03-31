'use client'
import { useCallback, useEffect, useState } from 'react'
import type { DailyUsage } from '@/lib/supabase'

export function useDailyUsage(days = 30) {
    const [data, setData] = useState<DailyUsage[]>([])
    const [loading, setLoading] = useState(true)

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/daily-usage?days=${days}`)
            const json = await res.json()
            if (json.data) setData(json.data)
        } finally {
            setLoading(false)
        }
    }, [days])

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 5 * 60 * 1000) // refresh every 5 min
        return () => clearInterval(interval)
    }, [fetchData])

    const resetData = async () => {
        await fetch('/api/daily-usage', { method: 'DELETE' })
        setData([])
    }

    return { data, loading, refresh: fetchData, resetData }
}
