'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings, Save, Zap, AlertTriangle, Info, LogOut, Mail, Phone, Bell } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { useAlerts } from '@/hooks/useAlerts'
import { useRealtimeReadings } from '@/hooks/useRealtimeReadings'
import { getTariffRate, setTariffRate, DEFAULT_TARIFF_RATE } from '@/lib/costCalculator'
import { DEFAULTS as SPIKE_DEFAULTS } from '@/lib/spikeDetector'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { logout } from '@/app/login/actions'

export default function SettingsPage() {
    const { unreadCount } = useAlerts()
    const { isConnected } = useRealtimeReadings(5)

    const [tariff, setTariff] = useState(DEFAULT_TARIFF_RATE)
    const [voltageThreshold, setVoltageThreshold] = useState(SPIKE_DEFAULTS.VOLTAGE_MAX)
    const [currentThreshold, setCurrentThreshold] = useState(SPIKE_DEFAULTS.CURRENT_MAX)
    const [deviceName, setDeviceName] = useState('ESP32 Smart Meter')
    
    // User Alert Settings
    const [alertEmail, setAlertEmail] = useState('')
    const [alertPhone, setAlertPhone] = useState('')
    const [sendEmailAlerts, setSendEmailAlerts] = useState(false)
    const [sendSmsAlerts, setSendSmsAlerts] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)

    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        setTariff(getTariffRate())
        const storedVT = localStorage.getItem('voltage_threshold')
        const storedCT = localStorage.getItem('current_threshold')
        const storedDN = localStorage.getItem('device_name')
        if (storedVT) setVoltageThreshold(parseFloat(storedVT))
        if (storedCT) setCurrentThreshold(parseFloat(storedCT))
        if (storedDN) setDeviceName(storedDN)

        async function fetchUserSettings() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            
            if (user) {
                setUserId(user.id)
                const { data, error } = await supabase
                    .from('user_settings')
                    .select('*')
                    .eq('id', user.id)
                    .single()
                
                if (data) {
                    setAlertEmail(data.alert_email || '')
                    setAlertPhone(data.alert_phone || '')
                    setSendEmailAlerts(data.send_email_alerts || false)
                    setSendSmsAlerts(data.send_sms_alerts || false)
                }
            }
            setLoaded(true)
        }

        fetchUserSettings()
    }, [])

    async function saveSettings() {
        setTariffRate(tariff)
        localStorage.setItem('voltage_threshold', voltageThreshold.toString())
        localStorage.setItem('current_threshold', currentThreshold.toString())
        localStorage.setItem('device_name', deviceName)

        if (userId) {
            const supabase = createClient()
            const { error } = await supabase.from('user_settings').upsert({
                id: userId,
                alert_email: alertEmail,
                alert_phone: alertPhone,
                send_email_alerts: sendEmailAlerts,
                send_sms_alerts: sendSmsAlerts,
                updated_at: new Date().toISOString()
            })

            if (error) {
                toast.error('Failed to save notification preferences')
                console.error(error)
                return
            }
        }

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
            <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6 pb-20">

                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Settings className="text-slate-400 w-6 h-6" /> Settings
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Configure tariff rates, thresholds, and your notification preferences</p>
                </div>

                {loaded && (
                    <>
                        {/* Notification Preferences */}
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="section-card space-y-4 border border-blue-500/20 bg-blue-500/5">
                            <div className="flex items-center gap-2 mb-1">
                                <Bell className="w-4 h-4 text-electric-blue" />
                                <h2 className="text-sm font-semibold text-slate-200">Alert Notification Preferences</h2>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-slate-300 text-sm font-medium flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-slate-400" /> Email Alerts
                                        </label>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={sendEmailAlerts} onChange={(e) => setSendEmailAlerts(e.target.checked)} className="sr-only peer" />
                                            <div className="w-9 h-5 bg-navy-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-electric-blue"></div>
                                        </label>
                                    </div>
                                    <input
                                        type="email"
                                        placeholder="your@email.com"
                                        value={alertEmail}
                                        onChange={(e) => setAlertEmail(e.target.value)}
                                        className={inputCls}
                                        disabled={!sendEmailAlerts}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-slate-300 text-sm font-medium flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-slate-400" /> SMS Alerts
                                        </label>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={sendSmsAlerts} onChange={(e) => setSendSmsAlerts(e.target.checked)} className="sr-only peer" />
                                            <div className="w-9 h-5 bg-navy-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-electric-blue"></div>
                                        </label>
                                    </div>
                                    <input
                                        type="tel"
                                        placeholder="+1234567890"
                                        value={alertPhone}
                                        onChange={(e) => setAlertPhone(e.target.value)}
                                        className={inputCls}
                                        disabled={!sendSmsAlerts}
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* Tariff */}
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="section-card space-y-4">
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
                        </motion.div>

                        {/* Spike Thresholds */}
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="section-card space-y-4">
                            <div className="flex items-center gap-2 mb-1">
                                <AlertTriangle className="w-4 h-4 text-alert-orange" />
                                <h2 className="text-sm font-semibold text-slate-200">System Thresholds</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-slate-400 text-xs mb-1.5 block">Max Voltage (V)</label>
                                    <input
                                        type="number"
                                        value={voltageThreshold}
                                        onChange={(e) => setVoltageThreshold(parseFloat(e.target.value))}
                                        className={inputCls}
                                    />
                                </div>
                                <div>
                                    <label className="text-slate-400 text-xs mb-1.5 block">Max Current (A)</label>
                                    <input
                                        type="number"
                                        value={currentThreshold}
                                        onChange={(e) => setCurrentThreshold(parseFloat(e.target.value))}
                                        className={inputCls}
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* Device Info */}
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="section-card space-y-4">
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
                        <div className="flex gap-3 pt-2">
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

                        {/* Logout Section at the very bottom */}
                        <div className="pt-12 mt-12 border-t border-white/10">
                            <form action={logout}>
                                <button 
                                    type="submit" 
                                    className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-red-500/10 text-red-500 font-bold hover:bg-red-500/20 border border-red-500/20 transition-all shadow-lg shadow-red-500/5 group"
                                >
                                    <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                                    Sign Out of GridSense
                                </button>
                            </form>
                            <p className="text-center text-slate-600 text-xs mt-4">
                                Version 1.0.4 • Secure Session
                            </p>
                        </div>
                    </>
                )}

            </main>
        </div>
    )
}
