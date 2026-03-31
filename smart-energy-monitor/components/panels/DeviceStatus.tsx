'use client'
import { motion } from 'framer-motion'
import { Wifi, WifiOff, Clock, Radio } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface DeviceStatusProps {
    isOnline: boolean
    lastSeen: Date | null
    deviceName?: string
}

export function DeviceStatus({ isOnline, lastSeen, deviceName = 'ESP32 Smart Meter' }: DeviceStatusProps) {
    return (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/8">
            <div className="relative">
                <motion.div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${isOnline ? 'bg-neon-green/15' : 'bg-slate-700/50'
                        }`}
                >
                    {isOnline ? (
                        <Wifi className="w-5 h-5 text-neon-green" />
                    ) : (
                        <WifiOff className="w-5 h-5 text-slate-500" />
                    )}
                </motion.div>
                {isOnline && (
                    <motion.span
                        className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-neon-green rounded-full"
                        animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <Radio className="w-3 h-3 text-slate-500" />
                    <p className="text-slate-200 text-sm font-medium truncate">{deviceName}</p>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-xs font-semibold ${isOnline ? 'text-neon-green' : 'text-slate-500'}`}>
                        {isOnline ? '● Online' : '● Offline'}
                    </span>
                    {lastSeen && (
                        <span className="text-slate-600 text-xs">
                            · Last seen {formatDistanceToNow(lastSeen, { addSuffix: true })}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}
