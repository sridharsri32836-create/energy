'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Zap, Activity, X, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import type { Alert } from '@/lib/supabase'

const alertConfig = {
    VOLTAGE_SPIKE: {
        icon: Zap,
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/10 border-yellow-500/30',
        glow: '0 0 20px rgba(234,179,8,0.15)',
        label: 'Voltage Spike',
    },
    CURRENT_SURGE: {
        icon: Activity,
        color: 'text-alert-orange',
        bg: 'bg-alert-orange/10 border-alert-orange/30',
        glow: '0 0 20px rgba(251,146,60,0.15)',
        label: 'Current Surge',
    },
    ANOMALY: {
        icon: AlertTriangle,
        color: 'text-alert-red',
        bg: 'bg-alert-red/10 border-alert-red/30',
        glow: '0 0 20px rgba(239,68,68,0.15)',
        label: 'Anomaly Detected',
    },
}

function getSeverity(alert: Alert): { label: string; cls: string } {
    if (alert.alert_type === 'VOLTAGE_SPIKE' || alert.alert_type === 'CURRENT_SURGE') {
        return { label: 'HIGH', cls: 'bg-alert-red/20 text-alert-red border-alert-red/30' }
    }
    const msg = alert.message.toLowerCase()
    if (msg.includes('off-hours') || msg.includes('power factor')) {
        return { label: 'LOW', cls: 'bg-neon-green/15 text-neon-green border-neon-green/25' }
    }
    return { label: 'MEDIUM', cls: 'bg-alert-orange/20 text-alert-orange border-alert-orange/30' }
}

interface AlertCardProps {
    alert: Alert
    onDismiss?: (id: string) => void
    compact?: boolean
}

export function AlertCard({ alert, onDismiss, compact = false }: AlertCardProps) {
    const config = alertConfig[alert.alert_type] ?? alertConfig.ANOMALY
    const Icon = config.icon

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className={`relative border rounded-xl p-4 ${config.bg} ${alert.is_read ? 'opacity-60' : ''}`}
            style={{ boxShadow: alert.is_read ? 'none' : config.glow }}
        >
            {/* Unread pulse dot */}
            {!alert.is_read && (
                <span className="absolute top-3 right-3">
                    <motion.span
                        className={`block w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')}`}
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                </span>
            )}

            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-white/5 ${config.color} flex-shrink-0`}>
                    <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
                        {(() => {
                            const sev = getSeverity(alert)
                            return (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${sev.cls}`}>
                                    {sev.label}
                                </span>
                            )
                        })()}
                    </div>
                    <p className="text-slate-300 text-sm leading-snug">{alert.message}</p>
                    {!compact && (
                        <p className="text-slate-500 text-xs mt-1">
                            {format(new Date(alert.timestamp), 'MMM d, yyyy • h:mm a')}
                        </p>
                    )}
                </div>
                {onDismiss && (
                    <button
                        onClick={() => onDismiss(alert.id)}
                        className="flex-shrink-0 p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        {alert.is_read ? (
                            <CheckCircle className="w-4 h-4 text-neon-green/60" />
                        ) : (
                            <X className="w-4 h-4" />
                        )}
                    </button>
                )}
            </div>
        </motion.div>
    )
}

interface AlertsPanelProps {
    alerts: Alert[]
    onDismiss?: (id: string) => void
    maxItems?: number
}

export function AlertsPanel({ alerts, onDismiss, maxItems = 5 }: AlertsPanelProps) {
    const visible = alerts.slice(0, maxItems)

    if (visible.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                <CheckCircle className="w-10 h-10 mb-2 text-neon-green/40" />
                <p className="text-sm">All clear — no active alerts</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <AnimatePresence>
                {visible.map((alert) => (
                    <AlertCard key={alert.id} alert={alert} onDismiss={onDismiss} />
                ))}
            </AnimatePresence>
        </div>
    )
}
