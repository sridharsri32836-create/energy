'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Filter, CheckSquare, Trash2 } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { AlertCard } from '@/components/alerts/AlertCard'
import { useAlerts } from '@/hooks/useAlerts'
import { useRealtimeReadings } from '@/hooks/useRealtimeReadings'

type FilterType = 'ALL' | 'VOLTAGE_SPIKE' | 'CURRENT_SURGE' | 'ANOMALY'

export default function AlertsPage() {
    const { alerts, unreadCount, markAsRead, markAllRead, deleteAlert, deleteAllAlerts } = useAlerts()
    const { isConnected } = useRealtimeReadings(5)
    const [filter, setFilter] = useState<FilterType>('ALL')

    const filtered = filter === 'ALL' ? alerts : alerts.filter(a => a.alert_type === filter)

    const counts = {
        ALL: alerts.length,
        VOLTAGE_SPIKE: alerts.filter(a => a.alert_type === 'VOLTAGE_SPIKE').length,
        CURRENT_SURGE: alerts.filter(a => a.alert_type === 'CURRENT_SURGE').length,
        ANOMALY: alerts.filter(a => a.alert_type === 'ANOMALY').length,
    }

    const filters: { value: FilterType; label: string; color: string }[] = [
        { value: 'ALL', label: 'All Alerts', color: 'text-slate-300' },
        { value: 'VOLTAGE_SPIKE', label: 'Voltage Spikes', color: 'text-yellow-400' },
        { value: 'CURRENT_SURGE', label: 'Current Surges', color: 'text-alert-orange' },
        { value: 'ANOMALY', label: 'Anomalies', color: 'text-alert-red' },
    ]

    return (
        <div className="min-h-screen">
            <Navbar isOnline={isConnected} unreadAlerts={unreadCount} />
            <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Bell className="text-alert-orange w-6 h-6" /> Alerts History
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            {unreadCount} unread · {alerts.length} total alerts
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-green/10 border border-neon-green/20 text-neon-green text-sm font-medium hover:bg-neon-green/15 transition-all"
                            >
                                <CheckSquare className="w-4 h-4" />
                                Mark All Read
                            </button>
                        )}
                        {alerts.length > 0 && (
                            <button
                                onClick={deleteAllAlerts}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-alert-red/10 border border-alert-red/20 text-alert-red text-sm font-medium hover:bg-alert-red/15 transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                                Clear All
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter tabs */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="w-4 h-4 text-slate-500" />
                    {filters.map(({ value, label, color }) => (
                        <button
                            key={value}
                            onClick={() => setFilter(value)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === value
                                    ? 'bg-white/10 border border-white/20 text-white'
                                    : 'text-slate-500 hover:text-slate-300 border border-transparent'
                                }`}
                        >
                            <span className={filter === value ? 'text-white' : color}>{label}</span>
                            <span className="ml-1.5 text-xs opacity-60">({counts[value]})</span>
                        </button>
                    ))}
                </div>

                {/* Alerts list */}
                <motion.div className="space-y-3">
                    <AnimatePresence>
                        {filtered.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="section-card flex flex-col items-center justify-center py-16 text-slate-500"
                            >
                                <Bell className="w-12 h-12 mb-3 opacity-20" />
                                <p>No alerts in this category</p>
                            </motion.div>
                        ) : (
                            filtered.map((alert) => (
                                <AlertCard key={alert.id} alert={alert} onDismiss={markAsRead} onDelete={deleteAlert} />
                            ))
                        )}
                    </AnimatePresence>
                </motion.div>

            </main>
        </div>
    )
}
