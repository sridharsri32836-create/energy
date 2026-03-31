'use client'
import { useEffect, useRef } from 'react'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { MeterReading } from '@/lib/supabase'
import { format } from 'date-fns'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

interface RealtimePowerChartProps {
    readings: MeterReading[]
}

export function RealtimePowerChart({ readings }: RealtimePowerChartProps) {
    const chartRef = useRef<ChartJS<'line'> | null>(null)

    const labels = readings.map((r) => format(new Date(r.timestamp), 'HH:mm:ss'))
    const powerData = readings.map((r) => r.power)
    const voltageData = readings.map((r) => r.voltage)

    const data = {
        labels,
        datasets: [
            {
                label: 'Power (W)',
                data: powerData,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
                fill: true,
                tension: 0.4,
                yAxisID: 'y',
            },
            {
                label: 'Voltage (V)',
                data: voltageData,
                borderColor: '#4ade80',
                backgroundColor: 'rgba(74, 222, 128, 0.05)',
                borderWidth: 1.5,
                pointRadius: 0,
                pointHoverRadius: 4,
                fill: false,
                tension: 0.4,
                yAxisID: 'y1',
            },
        ],
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        interaction: { mode: 'index' as const, intersect: false },
        plugins: {
            legend: {
                labels: { color: '#94a3b8', usePointStyle: true, pointStyleWidth: 10, font: { size: 12 } },
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                borderColor: 'rgba(59, 130, 246, 0.3)',
                borderWidth: 1,
                titleColor: '#e2e8f0',
                bodyColor: '#94a3b8',
                padding: 12,
            },
        },
        scales: {
            x: {
                grid: { color: 'rgba(255,255,255,0.04)' },
                ticks: {
                    color: '#475569',
                    maxTicksLimit: 8,
                    font: { size: 11 },
                },
            },
            y: {
                position: 'left' as const,
                grid: { color: 'rgba(255,255,255,0.04)' },
                ticks: { color: '#475569', font: { size: 11 } },
                title: { display: true, text: 'Power (W)', color: '#3b82f6', font: { size: 11 } },
            },
            y1: {
                position: 'right' as const,
                grid: { drawOnChartArea: false },
                ticks: { color: '#475569', font: { size: 11 } },
                title: { display: true, text: 'Voltage (V)', color: '#4ade80', font: { size: 11 } },
            },
        },
    }

    return (
        <div style={{ height: 280 }}>
            <Line ref={chartRef} data={data} options={options} />
        </div>
    )
}
