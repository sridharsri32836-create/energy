'use client'
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
import type { DailyUsage, Prediction } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

interface PredictionChartProps {
    actual: DailyUsage[]
    predictions: Prediction[]
}

export function PredictionChart({ actual, predictions }: PredictionChartProps) {
    const actualLabels = actual.slice(-14).map((d) => format(parseISO(d.date), 'MMM d'))
    const predLabels = predictions.map((d) => format(parseISO(d.date), 'MMM d'))
    const labels = [...actualLabels, ...predLabels]

    const actualValues = actual.slice(-14).map((d) => d.total_energy_kwh)
    const predValues = predictions.map((p) => p.predicted_energy)

    const data = {
        labels,
        datasets: [
            {
                label: 'Actual (kWh)',
                data: [...actualValues, ...Array(predValues.length).fill(null)],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                borderWidth: 2,
                pointRadius: 3,
                fill: true,
                tension: 0.4,
            },
            {
                label: 'Predicted (kWh)',
                data: [
                    ...Array(Math.max(0, actualValues.length - 1)).fill(null),
                    ...(actualValues.length > 0 ? [actualValues[actualValues.length - 1]] : []),
                    ...predValues,
                ],
                borderColor: '#a78bfa',
                borderDash: [6, 3],
                backgroundColor: 'rgba(167, 139, 250, 0.08)',
                borderWidth: 2,
                pointRadius: 3,
                fill: false,
                tension: 0.4,
            },
        ],
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: { color: '#94a3b8', usePointStyle: true, pointStyleWidth: 10, font: { size: 12 } },
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                borderColor: 'rgba(167,139,250, 0.3)',
                borderWidth: 1,
                titleColor: '#e2e8f0',
                bodyColor: '#94a3b8',
                padding: 12,
                callbacks: {
                    label: (ctx: { dataset: { label?: string }; raw: unknown }) =>
                        ` ${ctx.dataset.label}: ${Number(ctx.raw ?? 0).toFixed(2)} kWh`,
                },
            },
        },
        scales: {
            x: {
                grid: { color: 'rgba(255,255,255,0.04)' },
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
        <div style={{ height: 280 }}>
            <Line data={data} options={options} />
        </div>
    )
}
