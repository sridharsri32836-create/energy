'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, RefreshCw, Sparkles, RotateCcw } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { PredictionChart } from '@/components/charts/PredictionChart'
import { useDailyUsage } from '@/hooks/useDailyUsage'
import { useAlerts } from '@/hooks/useAlerts'
import { useRealtimeReadings } from '@/hooks/useRealtimeReadings'
import { formatCost, getTariffRate } from '@/lib/costCalculator'
import { format, parseISO } from 'date-fns'
import type { Prediction } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function PredictionsPage() {
    const { data: dailyUsage } = useDailyUsage(30)
    const { unreadCount } = useAlerts()
    const { isConnected } = useRealtimeReadings(5)
    const [predictions, setPredictions] = useState<Prediction[]>([])
    const [loading, setLoading] = useState(false)
    const tariffRate = getTariffRate()

    useEffect(() => {
        fetch('/api/predictions').then(r => r.json()).then(j => { if (j.data) setPredictions(j.data) })
    }, [])

    const totalPredictedCost = predictions.reduce((s, p) => s + p.predicted_cost, 0)
    const totalPredictedEnergy = predictions.reduce((s, p) => s + p.predicted_energy, 0)

    async function generate() {
        setLoading(true)
        try {
            const res = await fetch('/api/predictions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tariffRate }),
            })
            const json = await res.json()
            if (json.data) { setPredictions(json.data); toast.success('Predictions updated!') }
            else toast.error(json.error ?? 'Failed')
        } finally { setLoading(false) }
    }

    async function resetPredictions() {
        await fetch('/api/predictions', { method: 'DELETE' })
        setPredictions([])
        toast.success('Prediction data cleared')
    }

    return (
        <div className="min-h-screen">
            <Navbar isOnline={isConnected} unreadAlerts={unreadCount} />
            <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <TrendingUp className="text-purple-400 w-6 h-6" /> Energy Predictions
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">7-day electricity usage forecast using linear regression</p>
                    </div>
                    <button
                        onClick={generate}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 text-sm font-medium hover:bg-purple-500/20 transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Generating…' : 'Regenerate'}
                    </button>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative bg-white/5 backdrop-blur-md border border-white/10 shadow-lg shadow-black/20 hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-300 rounded-xl p-6 text-center overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none mix-blend-overlay" />
                        <div className="relative z-10">
                            <Sparkles className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                            <p className="text-slate-400 text-sm">7-Day Predicted Energy</p>
                            <p className="text-2xl font-bold text-purple-400 mt-1">{totalPredictedEnergy.toFixed(2)} kWh</p>
                        </div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative bg-white/5 backdrop-blur-md border border-white/10 shadow-lg shadow-black/20 hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-300 rounded-xl p-6 text-center overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none mix-blend-overlay" />
                        <div className="relative z-10">
                            <TrendingUp className="w-6 h-6 text-electric-blue mx-auto mb-2" />
                            <p className="text-slate-400 text-sm">7-Day Estimated Bill</p>
                            <p className="text-2xl font-bold text-electric-blue mt-1">{formatCost(totalPredictedCost)}</p>
                        </div>
                    </motion.div>
                </div>

                {/* Chart */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="section-card">
                    <h2 className="text-base font-semibold text-slate-200 mb-5">Actual vs Predicted Consumption</h2>
                    {predictions.length === 0 ? (
                        <div className="h-[280px] flex flex-col items-center justify-center text-slate-600 gap-2">
                            <p className="text-sm">No predictions yet — click Regenerate</p>
                        </div>
                    ) : (
                        <PredictionChart actual={dailyUsage} predictions={predictions} />
                    )}
                </motion.div>

                {/* Predictions table */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="section-card">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-base font-semibold text-slate-200">Daily Prediction Breakdown</h2>
                        <button
                            onClick={resetPredictions}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 text-slate-400 hover:text-white text-xs font-medium transition-all duration-150"
                            title="Delete prediction data"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Reset
                        </button>
                    </div>
                    {predictions.length === 0 ? (
                        <p className="text-center text-slate-600 text-sm py-8">No prediction data. Click Regenerate above.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/8 text-slate-400">
                                        <th className="text-left pb-3 font-medium">Date</th>
                                        <th className="text-right pb-3 font-medium">Predicted Energy (kWh)</th>
                                        <th className="text-right pb-3 font-medium">Predicted Cost (₹)</th>
                                        <th className="text-right pb-3 font-medium">Confidence</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {predictions.map((p, i) => (
                                        <tr key={p.date} className="hover:bg-white/3 transition-colors">
                                            <td className="py-3 text-slate-300">{format(parseISO(p.date), 'EEE, MMM d')}</td>
                                            <td className="py-3 text-right text-purple-400 font-bold font-mono">{p.predicted_energy.toFixed(3)}</td>
                                            <td className="py-3 text-right text-neon-green font-medium">₹{p.predicted_cost.toFixed(2)}</td>
                                            <td className="py-3 text-right">
                                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${i < 2 ? 'bg-neon-green/15 text-neon-green' :
                                                        i < 5 ? 'bg-electric-blue/15 text-electric-blue' :
                                                            'bg-slate-700 text-slate-400'
                                                    }`}>
                                                    {i < 2 ? 'High' : i < 5 ? 'Medium' : 'Low'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>

            </main>
        </div>
    )
}
