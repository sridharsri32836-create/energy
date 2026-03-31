'use client'
import { motion } from 'framer-motion'
import { Lightbulb, Clock, Leaf, Star } from 'lucide-react'
import type { MeterReading, DailyUsage } from '@/lib/supabase'

interface InsightsPanelProps {
    readings: MeterReading[]
    dailyUsage: DailyUsage[]
}

function getEfficiencyScore(avgPower: number): { score: number; label: string; color: string } {
    if (avgPower < 300) return { score: 92, label: 'Excellent', color: 'text-neon-green' }
    if (avgPower < 600) return { score: 75, label: 'Good', color: 'text-electric-blue' }
    if (avgPower < 1000) return { score: 55, label: 'Average', color: 'text-yellow-400' }
    return { score: 30, label: 'Poor', color: 'text-alert-orange' }
}

function getPeakHour(readings: MeterReading[]): string {
    if (readings.length === 0) return 'N/A'
    const maxReading = readings.reduce((a, b) => (a.power > b.power ? a : b))
    const hour = new Date(maxReading.timestamp).getHours()
    const ampm = hour >= 12 ? 'PM' : 'AM'
    return `${hour % 12 || 12}:00 ${ampm}`
}

export function InsightsPanel({ readings, dailyUsage }: InsightsPanelProps) {
    const avgPower = readings.length > 0
        ? readings.reduce((s, r) => s + r.power, 0) / readings.length
        : 0

    const avgDailyKwh = dailyUsage.length > 0
        ? dailyUsage.reduce((s, d) => s + d.total_energy_kwh, 0) / dailyUsage.length
        : 0

    const peakHour = getPeakHour(readings)
    const efficiency = getEfficiencyScore(avgPower)

    const insights = [
        {
            icon: Star,
            color: efficiency.color,
            label: 'Efficiency Score',
            value: `${efficiency.score}/100 — ${efficiency.label}`,
        },
        {
            icon: Clock,
            color: 'text-yellow-400',
            label: 'Peak Usage Hour',
            value: peakHour,
        },
        {
            icon: Lightbulb,
            color: 'text-electric-blue',
            label: 'Avg Daily Usage',
            value: `${avgDailyKwh.toFixed(2)} kWh`,
        },
        {
            icon: Leaf,
            color: 'text-neon-green',
            label: 'Savings Tip',
            value: avgPower > 600
                ? 'Try shifting heavy loads to off-peak hours (10 PM – 6 AM)'
                : 'Great job! Your energy usage is within optimal range',
        },
    ]

    return (
        <div className="space-y-3">
            {/* Efficiency Score Ring */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/8">
                <div className="relative w-14 h-14 flex-shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                        <motion.circle
                            cx="18" cy="18" r="15"
                            fill="none"
                            stroke={efficiency.score > 70 ? '#4ade80' : efficiency.score > 50 ? '#3b82f6' : '#fb923c'}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray={`${efficiency.score * 0.942} 94.2`}
                            initial={{ strokeDasharray: '0 94.2' }}
                            animate={{ strokeDasharray: `${efficiency.score * 0.942} 94.2` }}
                            transition={{ duration: 1.5, ease: 'easeOut' }}
                        />
                    </svg>
                    <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${efficiency.color}`}>
                        {efficiency.score}
                    </span>
                </div>
                <div>
                    <p className="text-slate-400 text-xs">Energy Efficiency Score</p>
                    <p className={`text-lg font-bold ${efficiency.color}`}>{efficiency.label}</p>
                    <p className="text-slate-500 text-xs">Based on average power usage</p>
                </div>
            </div>

            {insights.slice(1).map(({ icon: Icon, color, label, value }, i) => (
                <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/8"
                >
                    <div className={`p-2 rounded-lg bg-white/5 ${color}`}>
                        <Icon className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs">{label}</p>
                        <p className="text-slate-200 text-sm font-medium">{value}</p>
                    </div>
                </motion.div>
            ))}
        </div>
    )
}
