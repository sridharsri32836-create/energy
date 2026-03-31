export const TARIFF_RATE_KEY = 'tariff_rate'
export const DEFAULT_TARIFF_RATE = 6 // ₹ per kWh

/**
 * Calculate electricity cost
 * @param energyKwh - energy consumption in kWh
 * @param tariffRate - tariff rate in ₹ per kWh (default: 6)
 */
export function calculateCost(energyKwh: number, tariffRate: number = DEFAULT_TARIFF_RATE): number {
    return energyKwh * tariffRate
}

/**
 * Get tariff rate from localStorage or return default
 */
export function getTariffRate(): number {
    if (typeof window === 'undefined') return DEFAULT_TARIFF_RATE
    const stored = localStorage.getItem(TARIFF_RATE_KEY)
    return stored ? parseFloat(stored) : DEFAULT_TARIFF_RATE
}

/**
 * Save tariff rate to localStorage
 */
export function setTariffRate(rate: number): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(TARIFF_RATE_KEY, rate.toString())
    }
}

/**
 * Format cost as Indian Rupees
 */
export function formatCost(amount: number): string {
    return `₹${amount.toFixed(2)}`
}
