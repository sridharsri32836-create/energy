'use client'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
    label: string
    value: string | number
    unit: string
    icon: LucideIcon
    trend?: 'up' | 'down' | 'stable'
    trendValue?: string
    glowColor?: 'blue' | 'green' | 'orange' | 'purple'
    subLabel?: string
    delay?: number
}

const glowColors = {
    blue: {
        glow: 'from-electric-blue/20 via-transparent to-transparent',
        border: 'border-electric-blue/20 hover:border-electric-blue/40',
        iconBg: 'bg-electric-blue/10 text-electric-blue',
        valueBg: 'text-electric-blue',
        shadow: '0 0 40px rgba(59, 130, 246, 0.15)',
    },
    green: {
        glow: 'from-neon-green/20 via-transparent to-transparent',
        border: 'border-neon-green/20 hover:border-neon-green/40',
        iconBg: 'bg-neon-green/10 text-neon-green',
        valueBg: 'text-neon-green',
        shadow: '0 0 40px rgba(74, 222, 128, 0.15)',
    },
    orange: {
        glow: 'from-alert-orange/20 via-transparent to-transparent',
        border: 'border-alert-orange/20 hover:border-alert-orange/40',
        iconBg: 'bg-alert-orange/10 text-alert-orange',
        valueBg: 'text-alert-orange',
        shadow: '0 0 40px rgba(251, 146, 60, 0.15)',
    },
    purple: {
        glow: 'from-purple-500/20 via-transparent to-transparent',
        border: 'border-purple-500/20 hover:border-purple-500/40',
        iconBg: 'bg-purple-500/10 text-purple-400',
        valueBg: 'text-purple-400',
        shadow: '0 0 40px rgba(168, 85, 247, 0.15)',
    },
}

const trendIcons = {
    up: { icon: TrendingUp, color: 'text-alert-orange' },
    down: { icon: TrendingDown, color: 'text-neon-green' },
    stable: { icon: Minus, color: 'text-slate-400' },
}

export function MetricCard({
    label,
    value,
    unit,
    icon: Icon,
    trend = 'stable',
    trendValue,
    glowColor = 'blue',
    subLabel,
    delay = 0,
}: MetricCardProps) {
    const colors = glowColors[glowColor]
    const TrendIcon = trendIcons[trend].icon

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            className={`relative overflow-hidden rounded-2xl border bg-white/5 backdrop-blur-md shadow-lg shadow-black/20 hover:bg-white/10 p-6 cursor-default transition-all duration-300 ${colors.border}`}
            style={{ boxShadow: colors.shadow }}
        >
            {/* Background gradient glow */}
            <div className={`absolute inset-0 bg-gradient-to-br ${colors.glow} pointer-events-none`} />
            
            {/* Inner glassmorphism gradient for depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none z-0 mix-blend-overlay" />

            {/* Animated pulse ring on corner */}
            <motion.div
                className={`absolute -top-4 -right-4 w-24 h-24 rounded-full ${colors.iconBg} opacity-20`}
                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-2.5 rounded-xl ${colors.iconBg}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-medium ${trendIcons[trend].color}`}>
                        <TrendIcon className="w-3.5 h-3.5" />
                        {trendValue && <span>{trendValue}</span>}
                    </div>
                </div>

                {/* Value */}
                <div className="flex items-end gap-1.5 mb-1">
                    <motion.span
                        key={String(value)}
                        initial={{ opacity: 0.5, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`text-3xl font-bold tracking-tight ${colors.valueBg}`}
                    >
                        {typeof value === 'number' ? value.toFixed(value < 10 ? 2 : 1) : value}
                    </motion.span>
                    <span className="text-slate-400 text-sm mb-1">{unit}</span>
                </div>

                {/* Label */}
                <p className="text-slate-300 text-sm font-medium">{label}</p>
                {subLabel && <p className="text-slate-500 text-xs mt-0.5">{subLabel}</p>}
            </div>
        </motion.div>
    )
}
