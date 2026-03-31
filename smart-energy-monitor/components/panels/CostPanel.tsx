'use client'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, Calendar } from 'lucide-react'
import { formatCost } from '@/lib/costCalculator'

interface CostPanelProps {
    todayCost: number
    weeklyEstimate: number
    monthlyProjection: number
    tariffRate?: number
}

export function CostPanel({ todayCost, weeklyEstimate, monthlyProjection, tariffRate = 6 }: CostPanelProps) {
    const items = [
        {
            label: "Today's Cost",
            value: formatCost(todayCost),
            icon: DollarSign,
            color: 'text-electric-blue',
            bg: 'bg-electric-blue/10',
            delay: 0,
        },
        {
            label: 'Weekly Estimate',
            value: formatCost(weeklyEstimate),
            icon: TrendingUp,
            color: 'text-neon-green',
            bg: 'bg-neon-green/10',
            delay: 0.1,
        },
        {
            label: 'Monthly Projection',
            value: formatCost(monthlyProjection),
            icon: Calendar,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
            delay: 0.2,
        },
    ]

    return (
        <div className="space-y-3">
            {items.map(({ label, value, icon: Icon, color, bg, delay }) => (
                <motion.div
                    key={label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/8 hover:border-white/15 transition-all"
                >
                    <div className={`p-2.5 rounded-xl ${bg}`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <div className="flex-1">
                        <p className="text-slate-400 text-xs">{label}</p>
                        <motion.p
                            key={value}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`text-xl font-bold ${color}`}
                        >
                            {value}
                        </motion.p>
                    </div>
                </motion.div>
            ))}
            <p className="text-slate-600 text-xs text-center pt-1">
                Based on ₹{tariffRate}/kWh tariff rate
            </p>
        </div>
    )
}
