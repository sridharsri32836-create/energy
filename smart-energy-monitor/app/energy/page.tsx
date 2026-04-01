'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, Download, Filter, RotateCcw } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { DailyUsageChart } from '@/components/charts/DailyUsageChart'
import { useDailyUsage } from '@/hooks/useDailyUsage'
import { useAlerts } from '@/hooks/useAlerts'
import { useRealtimeReadings } from '@/hooks/useRealtimeReadings'
import { format, parseISO } from 'date-fns'
import { formatCost, getTariffRate } from '@/lib/costCalculator'
import { PasswordModal } from '@/components/modals/PasswordModal'
import dynamic from 'next/dynamic'

const WebSerialBar = dynamic(() => import('@/components/panels/WebSerialBar'), { ssr: false })

export default function EnergyPage() {
    const { data: dailyUsage, loading, resetData } = useDailyUsage(30)
    const { unreadCount } = useAlerts()
    const { readings, latestReading, isConnected, resetReadings } = useRealtimeReadings(20)
    const [filterDays, setFilterDays] = useState(30)
    const tariffRate = getTariffRate()

    // Password modal state
    const [pwModal, setPwModal] = useState<{ open: boolean; action: 'daily' | 'live' | null }>({ open: false, action: null })

    const filtered = dailyUsage.slice(-filterDays)
    const totalKwh = filtered.reduce((s, d) => s + d.total_energy_kwh, 0)
    const totalCost = filtered.reduce((s, d) => s + d.estimated_cost, 0)
    const avgDaily = filtered.length ? totalKwh / filtered.length : 0

    function handlePasswordSuccess() {
        if (pwModal.action === 'daily') resetData()
        if (pwModal.action === 'live') resetReadings()
    }

    return (
        <div className="min-h-screen">
            <Navbar isOnline={isConnected} unreadAlerts={unreadCount} />
            <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Zap className="text-electric-blue w-6 h-6" /> Energy Usage
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Detailed electricity consumption analytics</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-md shadow-inner border border-white/10 rounded-xl px-3 py-2 transition-all duration-300">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <select
                                value={filterDays}
                                onChange={(e) => setFilterDays(Number(e.target.value))}
                                className="bg-transparent text-slate-300 text-sm outline-none"
                            >
                                <option value={7}>Last 7 days</option>
                                <option value={14}>Last 14 days</option>
                                <option value={30}>Last 30 days</option>
                            </select>
                        </div>
                    </div>
                </div>

                <WebSerialBar />

                {/* Summary stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: 'Total Consumption', value: `${totalKwh.toFixed(2)} kWh`, color: 'text-electric-blue' },
                        { label: 'Total Cost', value: formatCost(totalCost), color: 'text-neon-green' },
                        { label: 'Daily Average', value: `${avgDaily.toFixed(2)} kWh`, color: 'text-purple-400' },
                    ].map((s, i) => (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="relative bg-white/5 backdrop-blur-md border border-white/10 shadow-lg shadow-black/20 hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-300 rounded-xl p-6 text-center overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none mix-blend-overlay" />
                            <div className="relative z-10">
                                <p className="text-slate-400 text-sm">{s.label}</p>
                                <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="section-card"
                >
                    <h2 className="text-base font-semibold text-slate-200 mb-5">Daily Consumption Chart</h2>
                    {loading ? (
                        <div className="h-[280px] flex items-center justify-center text-slate-600">Loading...</div>
                    ) : filtered.length === 0 ? (
                        <div className="h-[280px] flex items-center justify-center text-slate-600 text-sm">No data available</div>
                    ) : (
                        <DailyUsageChart data={filtered} />
                    )}
                </motion.div>

                {/* Raw readings table */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="section-card"
                >
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-base font-semibold text-slate-200">Daily Usage Table</h2>
                        <button
                            onClick={() => setPwModal({ open: true, action: 'daily' })}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 text-slate-400 hover:text-white text-xs font-medium transition-all duration-150"
                            title="Reset daily usage table"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Reset
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/8 text-slate-400">
                                    <th className="text-left pb-3 font-medium">Date</th>
                                    <th className="text-right pb-3 font-medium">Energy (kWh)</th>
                                    <th className="text-right pb-3 font-medium">Cost (₹)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {[...filtered].reverse().map((day) => (
                                    <tr key={day.date} className="hover:bg-white/3 transition-colors">
                                        <td className="py-3 text-slate-300">{format(parseISO(day.date), 'EEE, MMM d yyyy')}</td>
                                        <td className="py-3 text-right">
                                            <span className={`font-mono font-medium ${day.total_energy_kwh > 10 ? 'text-alert-orange' : 'text-electric-blue'}`}>
                                                {day.total_energy_kwh.toFixed(3)}
                                            </span>
                                        </td>
                                        <td className="py-3 text-right text-neon-green font-medium">₹{day.estimated_cost.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Live Readings */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="section-card"
                >
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-base font-semibold text-slate-200">Latest Live Readings</h2>
                        <button
                            onClick={() => setPwModal({ open: true, action: 'live' })}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 text-slate-400 hover:text-white text-xs font-medium transition-all duration-150"
                            title="Reset live readings"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Reset
                        </button>
                    </div>
                    {readings.length === 0 ? (
                        <p className="text-slate-600 text-sm text-center py-8">No readings received yet</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/8 text-slate-400">
                                        <th className="text-left pb-3 font-medium">Time</th>
                                        <th className="text-right pb-3 font-medium">Voltage (V)</th>
                                        <th className="text-right pb-3 font-medium">Current (A)</th>
                                        <th className="text-right pb-3 font-medium">Power (W)</th>
                                        <th className="text-right pb-3 font-medium">Energy (kWh)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {[...readings].reverse().slice(0, 15).map((r) => (
                                        <tr key={r.id} className="hover:bg-white/3 transition-colors">
                                            <td className="py-2.5 text-slate-400 font-mono text-xs">
                                                {format(new Date(r.timestamp), 'HH:mm:ss')}
                                            </td>
                                            <td className={`py-2.5 text-right font-mono ${r.voltage > 250 ? 'text-alert-orange font-bold' : 'text-slate-300'}`}>
                                                {r.voltage.toFixed(1)}
                                            </td>
                                            <td className={`py-2.5 text-right font-mono ${r.current > 15 ? 'text-alert-red font-bold' : 'text-slate-300'}`}>
                                                {r.current.toFixed(2)}
                                            </td>
                                            <td className="py-2.5 text-right text-electric-blue font-mono">{r.power.toFixed(0)}</td>
                                            <td className="py-2.5 text-right text-neon-green font-mono">{r.energy_kwh.toFixed(3)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            </main>

            {/* Password Modal */}
            <PasswordModal
                isOpen={pwModal.open}
                onClose={() => setPwModal({ open: false, action: null })}
                onSuccess={handlePasswordSuccess}
                title={pwModal.action === 'daily' ? 'Reset Daily Usage' : 'Reset Live Readings'}
                description={`Enter PIN to reset ${pwModal.action === 'daily' ? 'daily usage table' : 'live readings'}. This cannot be undone.`}
            />
        </div>
    )
}
