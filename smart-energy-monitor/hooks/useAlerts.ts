'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase, type Alert } from '@/lib/supabase'

export function useAlerts() {
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

    // Initial fetch
    useEffect(() => {
        async function fetchAlerts() {
            const { data } = await supabase
                .from('alerts')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(50)
            if (data) {
                setAlerts(data)
                setUnreadCount(data.filter((a) => !a.is_read).length)
            }
        }
        fetchAlerts()
    }, [])

    // Realtime subscription
    useEffect(() => {
        const channel = supabase
            .channel('alerts_live')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'alerts' },
                (payload) => {
                    const newAlert = payload.new as Alert
                    setAlerts((prev) => [newAlert, ...prev].slice(0, 50))
                    setUnreadCount((prev) => prev + 1)
                }
            )
            .subscribe()

        channelRef.current = channel
        return () => { supabase.removeChannel(channel) }
    }, [])

    async function markAsRead(id: string) {
        await fetch(`/api/alerts/${id}`, { method: 'PATCH' })
        setAlerts((prev) =>
            prev.map((a) => (a.id === id ? { ...a, is_read: true } : a))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
    }

    async function markAllRead() {
        const unread = alerts.filter((a) => !a.is_read)
        await Promise.all(unread.map((a) => fetch(`/api/alerts/${a.id}`, { method: 'PATCH' })))
        setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })))
        setUnreadCount(0)
    }
    async function deleteAlert(id: string) {
        await fetch(`/api/alerts/${id}`, { method: 'DELETE' })
        setAlerts((prev) => prev.filter((a) => a.id !== id))
        setUnreadCount((prevCount) => {
            const isUnread = alerts.find(a => a.id === id && !a.is_read)
            return isUnread ? Math.max(0, prevCount - 1) : prevCount
        })
    }

    async function deleteAllAlerts() {
        await fetch('/api/alerts', { method: 'DELETE' })
        setAlerts([])
        setUnreadCount(0)
    }

    return { alerts, unreadCount, markAsRead, markAllRead, deleteAlert, deleteAllAlerts }
}
