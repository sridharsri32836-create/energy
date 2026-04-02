'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { Zap, Activity, Power, Battery, RefreshCw, Mail, Calendar, FileText } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { MetricCard } from '@/components/cards/MetricCard'
import { RealtimePowerChart } from '@/components/charts/RealtimePowerChart'
import { DailyUsageChart } from '@/components/charts/DailyUsageChart'
import { PredictionChart } from '@/components/charts/PredictionChart'
import { AlertsPanel } from '@/components/alerts/AlertCard'
import { CostPanel } from '@/components/panels/CostPanel'
import { InsightsPanel } from '@/components/panels/InsightsPanel'
import { DeviceStatus } from '@/components/panels/DeviceStatus'
import { ReportPreviewModal } from '@/components/modals/ReportPreviewModal'
import { useRealtimeReadings } from '@/hooks/useRealtimeReadings'
import { useAlerts } from '@/hooks/useAlerts'
import { useDailyUsage } from '@/hooks/useDailyUsage'
import { getTariffRate } from '@/lib/costCalculator'
import type { Prediction } from '@/lib/supabase'
import toast from 'react-hot-toast'

const WebSerialBar = dynamic(() => import('@/components/panels/WebSerialBar'), { ssr: false })

function SectionCard({
  title,
  children,
  headerRight,
  className = '',
}: {
  title: string
  children: React.ReactNode
  headerRight?: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`section-card ${className}`}
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-slate-200">{title}</h2>
        {headerRight}
      </div>
      {children}
    </motion.div>
  )
}

export default function DashboardPage() {
  const { readings, latestReading, isConnected, lastSeen } = useRealtimeReadings(60)
  const { alerts, unreadCount, markAsRead, markAllRead } = useAlerts()
  const { data: dailyUsage, loading: dailyLoading } = useDailyUsage(30)
  
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [generatingPredictions, setGeneratingPredictions] = useState(false)
  
  // Preview Modal State
  const [previewData, setPreviewData] = useState<any | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  
  const tariffRate = getTariffRate()

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Load predictions
  useEffect(() => {
    async function loadPredictions() {
      const res = await fetch('/api/predictions')
      const json = await res.json()
      if (json.data) setPredictions(json.data)
    }
    loadPredictions()
  }, [])

  // Alert toast on new unread
  useEffect(() => {
    if (unreadCount > 0 && alerts[0] && !alerts[0].is_read) {
      toast.error(alerts[0].message.substring(0, 60) + '…', { id: alerts[0].id })
    }
  }, [unreadCount, alerts])

  const latest = latestReading
  const todayDateStr = new Date().toISOString().split('T')[0]
  const today = dailyUsage.find(d => d.date === todayDateStr)
  const weekTotal = dailyUsage.slice(-7).reduce((s, d) => s + d.total_energy_kwh, 0)
  const monthProjection = dailyUsage.slice(-7).reduce((s, d) => s + d.estimated_cost, 0) * (30 / 7)

  // Trend detection
  const prevPower = readings.length > 5 ? readings[readings.length - 5]?.power ?? 0 : 0
  const powerTrend =
    !latest ? 'stable' :
      latest.power > prevPower * 1.05 ? 'up' :
        latest.power < prevPower * 0.95 ? 'down' : 'stable'

  async function handleSendDemoReport(type: 'DAILY' | 'WEEKLY' | 'MONTHLY') {
    const id = toast.loading(`Generating ${type.toLowerCase()} report...`)
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      const json = await res.json()
      
      if (json.success) {
        // Calculation succeeded, show preview
        setPreviewData(json.data)
        setIsPreviewOpen(true)
        
        if (json.emailSent) {
          toast.success(json.message || 'Report sent and previewing!', { id })
        } else {
          // If email failed (likely quota), still show success for the calculation/preview
          toast.success('Report generated! (Email delivery skipped)', { id })
          toast(json.message || 'Email quota exceeded. Showing live preview...', {
            icon: '📊',
            duration: 6000,
          })
        }
      } else {
        toast.error(json.error || 'Failed to generate report', { id })
      }
    } catch (err) {
      toast.error('Connection error', { id })
    }
  }

  async function handleGeneratePredictions() {
    setGeneratingPredictions(true)
    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tariffRate }),
      })
      const json = await res.json()
      if (json.data) {
        setPredictions(json.data)
        toast.success('7-day predictions generated!')
      } else {
        toast.error(json.error ?? 'Failed to generate predictions')
      }
    } finally {
      setGeneratingPredictions(false)
    }
  }

  return (
    <div className="relative min-h-screen">
      <Navbar isOnline={isConnected} unreadAlerts={unreadCount} />

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Energy Dashboard</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Real-time electricity monitoring · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <DeviceStatus isOnline={isConnected} lastSeen={lastSeen} />
        </div>

        <WebSerialBar />

        {/* ─── Section 1: Metric Cards ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Voltage"
            value={latest?.voltage ?? 0}
            unit="V"
            icon={Zap}
            glowColor="blue"
            trend={latest && latest.voltage > 250 ? 'up' : 'stable'}
            trendValue={latest && latest.voltage > 250 ? 'High!' : undefined}
            subLabel="Line voltage"
            delay={0}
          />
          <MetricCard
            label="Current"
            value={latest?.current ?? 0}
            unit="A"
            icon={Activity}
            glowColor="green"
            trend={latest && latest.current > 10 ? 'up' : 'stable'}
            subLabel="Load current"
            delay={0.1}
          />
          <MetricCard
            label="Power"
            value={latest?.power ?? 0}
            unit="W"
            icon={Power}
            glowColor="orange"
            trend={powerTrend}
            trendValue={powerTrend !== 'stable' && latest ? `${Math.abs((latest.power - prevPower) / (prevPower || 1) * 100).toFixed(0)}%` : undefined}
            subLabel="Active power"
            delay={0.2}
          />
          <MetricCard
            label="Energy Today"
            value={today?.total_energy_kwh || 6.7}
            unit="kWh"
            icon={Battery}
            glowColor="purple"
            trend="stable"
            subLabel={today && today.total_energy_kwh > 0 
              ? `₹${today.estimated_cost.toFixed(2)} cost` 
              : `₹${(6.7 * tariffRate).toFixed(2)} cost`}
            delay={0.3}
          />
        </div>

        {/* ─── Section 2 + Alerts (2-col) ─── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <SectionCard title="⚡ Real-time Power & Voltage" className="xl:col-span-2">
            {readings.length === 0 ? (
              <div className="h-[280px] flex flex-col items-center justify-center text-slate-600">
                <Power className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">Waiting for device data…</p>
                <p className="text-xs mt-1">POST to /api/readings to start streaming</p>
              </div>
            ) : (
              <RealtimePowerChart readings={readings} />
            )}
          </SectionCard>

          <SectionCard
            title="🚨 Active Alerts"
            headerRight={
              unreadCount > 0 ? (
                <button
                  onClick={markAllRead}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Mark all read
                </button>
              ) : null
            }
          >
            <AlertsPanel alerts={alerts} onDismiss={markAsRead} maxItems={4} />
          </SectionCard>
        </div>

        {/* ─── Section 3 + Section 4 (Cost) ─── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <SectionCard title="📊 Daily Energy Usage (30 days)" className="xl:col-span-2">
            {dailyLoading ? (
              <div className="h-[240px] flex items-center justify-center text-slate-600">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading usage data…
              </div>
            ) : dailyUsage.length === 0 ? (
              <div className="h-[240px] flex items-center justify-center text-slate-600 text-sm">
                No daily usage data yet
              </div>
            ) : (
              <DailyUsageChart data={dailyUsage} />
            )}
          </SectionCard>

          <SectionCard title="💰 Cost Estimation">
            <CostPanel
              todayCost={today?.estimated_cost ?? 0}
              weeklyEstimate={weekTotal * tariffRate}
              monthlyProjection={monthProjection}
              tariffRate={tariffRate}
            />
          </SectionCard>
        </div>

        {/* ─── Section 5: Prediction ─── */}
        <SectionCard
          title="🔮 Energy Prediction — Next 7 Days"
          headerRight={
            <button
              onClick={handleGeneratePredictions}
              disabled={generatingPredictions}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-electric-blue/10 border border-electric-blue/30 text-electric-blue text-xs font-medium hover:bg-electric-blue/20 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${generatingPredictions ? 'animate-spin' : ''}`} />
              {generatingPredictions ? 'Generating…' : 'Regenerate'}
            </button>
          }
        >
          {predictions.length === 0 && dailyUsage.length === 0 ? (
            <div className="h-[280px] flex flex-col items-center justify-center text-slate-600 gap-2">
              <p className="text-sm">No data available for predictions</p>
              <p className="text-xs">Need at least 3 days of usage data</p>
            </div>
          ) : (
            <PredictionChart actual={dailyUsage} predictions={predictions} />
          )}
        </SectionCard>

        {/* ─── Section 7: Insights ─── */}
        <SectionCard title="💡 Energy Insights">
          <InsightsPanel readings={readings} dailyUsage={dailyUsage} />
        </SectionCard>

        {/* ─── Section 8: Demo & Presentation ─── */}
        <SectionCard 
            title="🛠️ Demo & Presentation Controls" 
            className="border border-yellow-500/10 bg-yellow-500/5"
        >
          <div className="p-4 rounded-xl bg-black/20 border border-white/5">
            <h3 className="text-sm font-medium text-slate-300 mb-3">One-Click Email Reports (Mock Data)</h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => handleSendDemoReport('DAILY')}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600/10 border border-blue-600/40 text-blue-400 hover:bg-blue-600/20 transition-all text-sm font-semibold"
              >
                <Mail className="w-4 h-4" />
                Send Daily Report
              </button>
              <button
                onClick={() => handleSendDemoReport('WEEKLY')}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600/10 border border-indigo-600/40 text-indigo-400 hover:bg-indigo-600/20 transition-all text-sm font-semibold"
              >
                <Calendar className="w-4 h-4" />
                Send Weekly Report
              </button>
              <button
                onClick={() => handleSendDemoReport('MONTHLY')}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600/10 border border-purple-600/40 text-purple-400 hover:bg-purple-600/20 transition-all text-sm font-semibold"
              >
                <FileText className="w-4 h-4" />
                Send March Report (Monthly)
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-4 italic">
              * These buttons use historical data (including the generated March data) to send simulation emails to your verified address.
            </p>
          </div>
        </SectionCard>

      </main>

      {/* Report Preview Modal */}
      <ReportPreviewModal 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        data={previewData} 
      />
    </div>
  )
}
