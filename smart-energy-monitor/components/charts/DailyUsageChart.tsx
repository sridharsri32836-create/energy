'use client'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import type { DailyUsage } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

interface DailyUsageChartProps {
    data: DailyUsage[]
}

export function DailyUsageChart({ data }: DailyUsageChartProps) {
    const labels = data.map((d) => format(parseISO(d.date), 'MMM d'))
    const values = data.map((d) => d.total_energy_kwh)

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Energy (kWh)',
                data: values,
                backgroundColor: (ctx: { dataIndex: number }) => {
                    const val = values[ctx.dataIndex] ?? 0
                    const max = Math.max(...values, 1)
                    const ratio = val / max
                    return ratio > 0.85
                        ? 'rgba(251, 146, 60, 0.85)'
                        : ratio > 0.65
                            ? 'rgba(59, 130, 246, 0.85)'
                            : 'rgba(59, 130, 246, 0.5)'
                },
                borderRadius: 6,
                borderSkipped: false,
            },
        ],
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                borderColor: 'rgba(59, 130, 246, 0.3)',
                borderWidth: 1,
                titleColor: '#e2e8f0',
                bodyColor: '#94a3b8',
                padding: 12,
                callbacks: {
                    label: (ctx: { raw: unknown }) => ` ${Number(ctx.raw).toFixed(2)} kWh`,
                },
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#475569', font: { size: 11 }, maxRotation: 45 },
            },
            y: {
                grid: { color: 'rgba(255,255,255,0.04)' },
                ticks: {
                    color: '#475569',
                    font: { size: 11 },
                    callback: (val: string | number) => `${val} kWh`,
                },
            },
        },
    }

    return (
        <div style={{ height: 240 }}>
            <Bar data={chartData} options={options} />
        </div>
    )
}
