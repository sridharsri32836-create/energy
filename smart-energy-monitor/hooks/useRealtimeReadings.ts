'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase, type MeterReading } from '@/lib/supabase'

// Device is considered offline if no reading arrives within this window
const OFFLINE_TIMEOUT_MS = 30_000 // 30 seconds

export function useRealtimeReadings(initialLimit = 60) {
    const [readings, setReadings] = useState<MeterReading[]>([])
    const [latestReading, setLatestReading] = useState<MeterReading | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [lastSeen, setLastSeen] = useState<Date | null>(null)
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
    const offlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Mark device online and reset the inactivity timer
    const markOnline = () => {
        setIsConnected(true)
        setLastSeen(new Date())
        if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current)
        offlineTimerRef.current = setTimeout(() => {
            setIsConnected(false)
            setLatestReading(null) // NEW: Clear stale data when offline
        }, OFFLINE_TIMEOUT_MS)
    }

    // Initial fetch
    useEffect(() => {
        async function fetchInitial() {
            const { data } = await supabase
                .from('meter_readings')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(initialLimit)

            if (data && data.length > 0) {
                const sorted = data.reverse()
                setReadings(sorted)
                
                // Only set as latest if it's not stale (last 30s)
                const latest = sorted[sorted.length - 1]
                const readingTime = new Date(latest.timestamp).getTime()
                const now = new Date().getTime()
                
                if (now - readingTime < OFFLINE_TIMEOUT_MS) {
                    setLatestReading(latest)
                    markOnline()
                } else {
                    setLatestReading(null)
                    setIsConnected(false)
                }
            }
        }
        fetchInitial()
        return () => { if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialLimit])

    // Realtime subscription — only data arrival drives online state, NOT WebSocket status
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
                    markOnline()
                }
            )
            .subscribe()

        channelRef.current = channel
        return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialLimit])

    const resetReadings = async () => {
        await fetch('/api/readings', { method: 'DELETE' })
        setReadings([])
        setLatestReading(null)
    }

    return { readings, latestReading, isConnected, lastSeen, resetReadings }
}
