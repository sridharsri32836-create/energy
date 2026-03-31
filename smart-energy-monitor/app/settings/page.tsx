'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings, Save, Zap, AlertTriangle, Info } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { useAlerts } from '@/hooks/useAlerts'
import { useRealtimeReadings } from '@/hooks/useRealtimeReadings'
import { getTariffRate, setTariffRate, DEFAULT_TARIFF_RATE } from '@/lib/costCalculator'
import { DEFAULTS as SPIKE_DEFAULTS } from '@/lib/spikeDetector'
import toast from 'react-hot-toast'

export default function SettingsPage() {
    const { unreadCount } = useAlerts()
    const { isConnected } = useRealtimeReadings(5)

    const [tariff, setTariff] = useState(DEFAULT_TARIFF_RATE)
    const [voltageThreshold, setVoltageThreshold] = useState(SPIKE_DEFAULTS.VOLTAGE_MAX)
    const [currentThreshold, setCurrentThreshold] = useState(SPIKE_DEFAULTS.CURRENT_MAX)
    const [deviceName, setDeviceName] = useState('ESP32 Smart Meter')
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        setTariff(getTariffRate())
        const storedVT = localStorage.getItem('voltage_threshold')
        const storedCT = localStorage.getItem('current_threshold')
        const storedDN = localStorage.getItem('device_name')
        if (storedVT) setVoltageThreshold(parseFloat(storedVT))
        if (storedCT) setCurrentThreshold(parseFloat(storedCT))
        if (storedDN) setDeviceName(storedDN)
        setLoaded(true)
    }, [])

    function saveSettings() {
        setTariffRate(tariff)
        localStorage.setItem('voltage_threshold', voltageThreshold.toString())
        localStorage.setItem('current_threshold', currentThreshold.toString())
        localStorage.setItem('device_name', deviceName)
        toast.success('Settings saved!')
    }

    function resetDefaults() {
        setTariff(DEFAULT_TARIFF_RATE)
        setVoltageThreshold(SPIKE_DEFAULTS.VOLTAGE_MAX)
        setCurrentThreshold(SPIKE_DEFAULTS.CURRENT_MAX)
        setDeviceName('ESP32 Smart Meter')
        toast.success('Reset to defaults')
    }

    const inputCls = "w-full bg-white/5 backdrop-blur-md shadow-inner border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-electric-blue/50 focus:ring-1 focus:ring-electric-blue/20 focus:bg-white/10 transition-all duration-300"

    return (
        <div className="min-h-screen">
            <Navbar isOnline={isConnected} unreadAlerts={unreadCount} />
            <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">

                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Settings className="text-slate-400 w-6 h-6" /> Settings
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Configure tariff rates, thresholds, and device info</p>
                </div>

                {loaded && (
                    <>
                        {/* Tariff */}
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="section-card space-y-4">
                            <div className="flex items-center gap-2 mb-1">
                                <Zap className="w-4 h-4 text-electric-blue" />
                                <h2 className="text-sm font-semibold text-slate-200">Electricity Tariff</h2>
                            </div>
                            <div>
                                <label className="text-slate-400 text-xs mb-1.5 block">Tariff Rate (₹ per kWh)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="1"
                                        max="50"
                                        value={tariff}
                                        onChange={(e) => setTariff(parseFloat(e.target.value))}
                                        className={`${inputCls} pl-8`}
                                    />
                                </div>
                                <p className="text-slate-600 text-xs mt-1">Default: ₹{DEFAULT_TARIFF_RATE}/kWh (Indian tariff rates)</p>
                            </div>
                            <div className="p-3 rounded-lg bg-electric-blue/5 border border-electric-blue/15 flex gap-2">
                                <Info className="w-4 h-4 text-electric-blue flex-shrink-0 mt-0.5" />
                                <p className="text-slate-400 text-xs">
                                    Monthly bill estimate at ₹{tariff}/kWh: If average daily usage is 8 kWh →
                                    <span className="text-electric-blue font-medium"> ₹{(8 * 30 * tariff).toFixed(0)}/month</span>
                                </p>
                            </div>
                        </motion.div>

                        {/* Spike Thresholds */}
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="section-card space-y-4">
                            <div className="flex items-center gap-2 mb-1">
                                <AlertTriangle className="w-4 h-4 text-alert-orange" />
                                <h2 className="text-sm font-semibold text-slate-200">Alert Thresholds</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-slate-400 text-xs mb-1.5 block">Max Voltage (V)</label>
                                    <input
                                        type="number"
                                        step="1"
                                        min="220"
                                        max="300"
                                        value={voltageThreshold}
                                        onChange={(e) => setVoltageThreshold(parseFloat(e.target.value))}
                                        className={inputCls}
                                    />
                                    <p className="text-slate-600 text-xs mt-1">Alert above this V</p>
                                </div>
                                <div>
                                    <label className="text-slate-400 text-xs mb-1.5 block">Max Current (A)</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="5"
                                        max="30"
                                        value={currentThreshold}
                                        onChange={(e) => setCurrentThreshold(parseFloat(e.target.value))}
                                        className={inputCls}
                                    />
                                    <p className="text-slate-600 text-xs mt-1">Alert above this A</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Device Info */}
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="section-card space-y-4">
                            <h2 className="text-sm font-semibold text-slate-200">Device Info</h2>
                            <div>
                                <label className="text-slate-400 text-xs mb-1.5 block">Device Name</label>
                                <input
                                    type="text"
                                    value={deviceName}
                                    onChange={(e) => setDeviceName(e.target.value)}
                                    className={inputCls}
                                />
                            </div>

                        </motion.div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={saveSettings}
                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-electric-blue text-white font-semibold hover:bg-electric-blue-dark transition-all"
                            >
                                <Save className="w-4 h-4" />
                                Save Settings
                            </button>
                            <button
                                onClick={resetDefaults}
                                className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-sm hover:text-slate-200 hover:bg-white/8 transition-all"
                            >
                                Reset Defaults
                            </button>
                        </div>
                    </>
                )}

            </main>
        </div>
    )
}
