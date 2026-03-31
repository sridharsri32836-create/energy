'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase, type MeterReading } from '@/lib/supabase'

export function useRealtimeReadings(initialLimit = 60) {
    const [readings, setReadings] = useState<MeterReading[]>([])
    const [latestReading, setLatestReading] = useState<MeterReading | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [lastSeen, setLastSeen] = useState<Date | null>(null)
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

    // Initial fetch
    useEffect(() => {
        async function fetchInitial() {
            const { data } = await supabase
                .from('meter_readings')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(initialLimit)
            if (data) {
                const sorted = data.reverse()
                setReadings(sorted)
                if (sorted.length > 0) {
                    setLatestReading(sorted[sorted.length - 1])
                    setLastSeen(new Date())
                }
            }
        }
        fetchInitial()
    }, [initialLimit])

    // Realtime subscription
    useEffect(() => {
        const channel = supabase
            .channel('meter_readings_live')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'meter_readings' },
                (payload) => {
                    const newReading = payload.new as MeterReading
                    setReadings((prev) => {
                        const updated = [...prev, newReading]
                        return updated.length > initialLimit ? updated.slice(-initialLimit) : updated
                    })
                    setLatestReading(newReading)
                    setLastSeen(new Date())
                    setIsConnected(true)
                }
            )
            .subscribe((status) => {
                setIsConnected(status === 'SUBSCRIBED')
            })

        channelRef.current = channel
        return () => { supabase.removeChannel(channel) }
    }, [initialLimit])

    const resetReadings = async () => {
        await fetch('/api/readings', { method: 'DELETE' })
        setReadings([])
        setLatestReading(null)
    }

    return { readings, latestReading, isConnected, lastSeen, resetReadings }
}
