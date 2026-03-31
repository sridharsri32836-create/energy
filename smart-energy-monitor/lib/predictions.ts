import type { DailyUsage } from './supabase'

/**
 * Simple linear regression
 * Returns { slope, intercept }
 */
export function linearRegression(y: number[]): { slope: number; intercept: number } {
    const n = y.length
    if (n === 0) return { slope: 0, intercept: 0 }
    const x = Array.from({ length: n }, (_, i) => i)
    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((s, xi, i) => s + xi * y[i], 0)
    const sumXX = x.reduce((s, xi) => s + xi * xi, 0)
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) || 0
    const intercept = (sumY - slope * sumX) / n
    return { slope, intercept }
}

/**
 * Moving average
 */
export function movingAverage(data: number[], window = 7): number[] {
    return data.map((_, i) => {
        const slice = data.slice(Math.max(0, i - window + 1), i + 1)
        return slice.reduce((a, b) => a + b, 0) / slice.length
    })
}

/**
 * Generate 7-day predictions from daily usage data
 * Uses linear regression with a floor of 0
 */
export function generatePredictions(
    dailyData: DailyUsage[],
    tariffRate: number = 6,
    days = 7
): { date: string; predicted_energy: number; predicted_cost: number }[] {
    const sorted = [...dailyData].sort((a, b) => a.date.localeCompare(b.date))
    const values = sorted.map((d) => d.total_energy_kwh)
    const { slope, intercept } = linearRegression(values)
    const n = values.length

    const results = []
    const today = new Date()
    for (let i = 1; i <= days; i++) {
        const predictedEnergy = Math.max(0, intercept + slope * (n + i - 1))
        const forecastDate = new Date(today)
        forecastDate.setDate(today.getDate() + i)
        results.push({
            date: forecastDate.toISOString().split('T')[0],
            predicted_energy: parseFloat(predictedEnergy.toFixed(4)),
            predicted_cost: parseFloat((predictedEnergy * tariffRate).toFixed(2)),
        })
    }
    return results
}
