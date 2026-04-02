'use client'
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, Calendar } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { useDailyUsage } from '@/hooks/useDailyUsage'
import { useAlerts } from '@/hooks/useAlerts'
import { useRealtimeReadings } from '@/hooks/useRealtimeReadings'
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { formatCost, getTariffRate } from '@/lib/costCalculator'
import toast from 'react-hot-toast'

export default function ReportsPage() {
    const { data: dailyUsage } = useDailyUsage(90)
    const { alerts, unreadCount } = useAlerts()
    const { isConnected } = useRealtimeReadings(5)
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
    const inputRef = useRef<HTMLInputElement>(null)
    const maxMonth = format(new Date(), 'yyyy-MM')
    const tariffRate = getTariffRate()

    // Filter by selected month — use parseISO + '-01' to avoid timezone shifts
    const monthStart = startOfMonth(parseISO(selectedMonth + '-01'))
    const monthEnd = endOfMonth(monthStart)
    const monthData = dailyUsage.filter((d) =>
        isWithinInterval(parseISO(d.date), { start: monthStart, end: monthEnd })
    )
    const monthAlerts = alerts.filter((a) =>
        isWithinInterval(new Date(a.timestamp), { start: monthStart, end: monthEnd })
    )

    const totalKwh = monthData.reduce((s, d) => s + d.total_energy_kwh, 0)
    const totalCost = monthData.reduce((s, d) => s + d.estimated_cost, 0)
    const avgDaily = monthData.length ? totalKwh / monthData.length : 0
    const peakDay = monthData.length
        ? monthData.reduce((a, b) => (a.total_energy_kwh > b.total_energy_kwh ? a : b))
        : null

    async function exportPDF() {
        toast.loading('Generating PDF…', { id: 'pdf' })
        try {
            const { jsPDF } = await import('jspdf')
            const autoTable = (await import('jspdf-autotable')).default

            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
            const pageWidth = doc.internal.pageSize.getWidth()

            // Header
            doc.setFillColor(3, 7, 30)
            doc.rect(0, 0, pageWidth, 40, 'F')
            doc.setTextColor(59, 130, 246)
            doc.setFontSize(22)
            doc.setFont('helvetica', 'bold')
            doc.text('Smart Energy Monitor', 14, 18)
            doc.setFontSize(12)
            doc.setTextColor(148, 163, 184)
            doc.text(`Monthly Report — ${format(monthStart, 'MMMM yyyy')}`, 14, 30)

            // Summary box
            doc.setFillColor(10, 17, 40)
            doc.setDrawColor(30, 58, 95)
            doc.roundedRect(14, 48, pageWidth - 28, 38, 4, 4, 'FD')
            doc.setTextColor(148, 163, 184)
            doc.setFontSize(9)
            doc.text('Total Consumption', 20, 58)
            doc.text('Total Cost', 70, 58)
            doc.text('Daily Average', 120, 58)
            doc.text('Peak Day', 160, 58)
            doc.setTextColor(59, 130, 246)
            doc.setFontSize(14)
            doc.setFont('helvetica', 'bold')
            doc.text(`${totalKwh.toFixed(2)} kWh`, 20, 70)
            doc.text(`₹${totalCost.toFixed(2)}`, 70, 70)
            doc.text(`${avgDaily.toFixed(2)} kWh`, 120, 70)
            doc.text(peakDay ? format(parseISO(peakDay.date), 'MMM d') : 'N/A', 160, 70)

            // Table
            doc.setFont('helvetica', 'normal')
            autoTable(doc, {
                startY: 96,
                head: [['Date', 'Energy (kWh)', 'Cost (₹)', 'Status']],
                body: monthData.map((d) => [
                    format(parseISO(d.date), 'EEE, MMM d'),
                    d.total_energy_kwh.toFixed(3),
                    `₹${d.estimated_cost.toFixed(2)}`,
                    d.total_energy_kwh > 10 ? 'High Usage' : d.total_energy_kwh > 6 ? 'Normal' : 'Low',
                ]),
                styles: { fontSize: 9, textColor: [148, 163, 184], fillColor: [10, 17, 40] },
                headStyles: { fillColor: [30, 58, 95], textColor: [226, 232, 240], fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [6, 12, 36] },
                theme: 'grid',
            })

            // Alerts summary
            if (monthAlerts.length > 0) {
                const currentY = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 200
                doc.setTextColor(251, 146, 60)
                doc.setFontSize(12)
                doc.setFont('helvetica', 'bold')
                doc.text(`Alerts (${monthAlerts.length})`, 14, currentY + 12)

                autoTable(doc, {
                    startY: currentY + 18,
                    head: [['Type', 'Value', 'Time', 'Message']],
                    body: monthAlerts.slice(0, 20).map((a) => [
                        a.alert_type,
                        a.value.toFixed(1),
                        format(new Date(a.timestamp), 'MMM d, HH:mm'),
                        a.message.substring(0, 50) + '…',
                    ]),
                    styles: { fontSize: 8, textColor: [148, 163, 184], fillColor: [10, 17, 40] },
                    headStyles: { fillColor: [60, 30, 10], textColor: [251, 146, 60], fontStyle: 'bold' },
                    theme: 'grid',
                })
            }

            // Footer
            doc.setFontSize(8)
            doc.setTextColor(71, 85, 105)
            doc.text(
                `Generated by Smart Energy Monitor on ${format(new Date(), 'MMM d, yyyy HH:mm')} • Tariff: ₹${tariffRate}/kWh`,
                14,
                doc.internal.pageSize.getHeight() - 8
            )

            doc.save(`energy-report-${selectedMonth}.pdf`)
            toast.success('PDF exported!', { id: 'pdf' })
        } catch (err) {
            toast.error('PDF generation failed', { id: 'pdf' })
            console.error(err)
        }
    }

    return (
        <div className="min-h-screen">
            <Navbar isOnline={isConnected} unreadAlerts={unreadCount} />
            <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <FileText className="text-neon-green w-6 h-6" /> Monthly Report
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Comprehensive monthly electricity usage report</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div 
                            onClick={() => inputRef.current?.showPicker()}
                            className="flex items-center gap-2 bg-white/5 backdrop-blur-md shadow-inner border border-white/10 rounded-xl px-3 py-2 transition-all duration-300 hover:bg-white/10 cursor-pointer"
                        >
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <input
                                ref={inputRef}
                                type="month"
                                value={selectedMonth}
                                max={maxMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="bg-transparent text-slate-300 text-sm outline-none min-w-[120px] cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                        <button
                            onClick={exportPDF}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-green/10 border border-neon-green/20 text-neon-green text-sm font-medium hover:bg-neon-green/20 transition-all"
                        >
                            <Download className="w-4 h-4" />
                            Export PDF
                        </button>
                    </div>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Total kWh', value: `${totalKwh.toFixed(2)}`, unit: 'kWh', color: 'text-electric-blue' },
                        { label: 'Total Cost', value: formatCost(totalCost), unit: '', color: 'text-neon-green' },
                        { label: 'Daily Avg', value: `${avgDaily.toFixed(2)}`, unit: 'kWh', color: 'text-purple-400' },
                        { label: 'Alerts', value: String(monthAlerts.length), unit: 'events', color: 'text-alert-orange' },
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
                                <p className="text-slate-400 text-xs mb-1">{s.label}</p>
                                <p className={`text-xl font-bold ${s.color}`}>{s.value} <span className="text-sm font-normal text-slate-500">{s.unit}</span></p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Usage Table */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="section-card">
                    <h2 className="text-base font-semibold text-slate-200 mb-5">
                        {format(monthStart, 'MMMM yyyy')} — Daily Breakdown
                    </h2>
                    {monthData.length === 0 ? (
                        <p className="text-center text-slate-600 text-sm py-10">No data for this month</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/8 text-slate-400">
                                        <th className="text-left pb-3 font-medium">Date</th>
                                        <th className="text-right pb-3 font-medium">Energy (kWh)</th>
                                        <th className="text-right pb-3 font-medium">Cost (₹)</th>
                                        <th className="text-right pb-3 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {[...monthData].reverse().map((day) => {
                                        const isPeak = peakDay?.date === day.date
                                        const status = day.total_energy_kwh > 10 ? 'High' : day.total_energy_kwh > 6 ? 'Normal' : 'Low'
                                        const statusColor = status === 'High' ? 'text-alert-orange bg-alert-orange/10' : status === 'Normal' ? 'text-electric-blue bg-electric-blue/10' : 'text-neon-green bg-neon-green/10'
                                        return (
                                            <tr key={day.date} className={`hover:bg-white/3 transition-colors ${isPeak ? 'bg-electric-blue/5' : ''}`}>
                                                <td className="py-3 text-slate-300 flex items-center gap-2">
                                                    {format(parseISO(day.date), 'EEE, MMM d')}
                                                    {isPeak && <span className="text-[10px] bg-electric-blue/20 text-electric-blue px-1.5 py-0.5 rounded-full">Peak</span>}
                                                </td>
                                                <td className="py-3 text-right font-mono font-medium text-slate-200">{day.total_energy_kwh.toFixed(3)}</td>
                                                <td className="py-3 text-right text-neon-green">₹{day.estimated_cost.toFixed(2)}</td>
                                                <td className="py-3 text-right">
                                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor}`}>{status}</span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>

            </main>
        </div>
    )
}
