export type SpikeResult = {
    isSpike: boolean
    alertType?: 'VOLTAGE_SPIKE' | 'CURRENT_SURGE' | 'ANOMALY'
    severity?: 'HIGH' | 'MEDIUM' | 'LOW'
    value?: number
    message?: string
}

type Reading = { voltage: number; current: number; power: number; pf?: number }

/**
 * Spike detection thresholds (configurable via Settings)
 */
export const DEFAULTS = {
    VOLTAGE_MAX: 250,       // V — absolute ceiling
    VOLTAGE_JUMP_PCT: 10,   // % — rapid jump between consecutive readings
    CURRENT_MAX: 15,        // A
    POWER_SPIKE_RATIO: 1.5, // multiplier vs recent moving average (was 2.0 — too high)
    PF_MIN: 0.70,           // power factor below which an anomaly is logged
    OFF_HOURS_POWER: 200,   // W — threshold for "unusual" during 10 PM–5 AM
}

/**
 * Detect spikes/anomalies in a new reading.
 * @param reading       The latest reading
 * @param recentReadings  Previous readings in ASCENDING order (oldest first, newest last)
 * @param thresholds    Override defaults (e.g. from Settings)
 * @param isoTimestamp  Reading timestamp (defaults to now)
 */
export function detectSpike(
    reading: Reading,
    recentReadings: Reading[],
    thresholds = DEFAULTS,
    isoTimestamp?: string,
): SpikeResult[] {
    const results: SpikeResult[] = []
    const ts = isoTimestamp ? new Date(isoTimestamp) : new Date()

    // ─── 1. Absolute voltage spike ─────────────────────────────────────────
    if (reading.voltage > thresholds.VOLTAGE_MAX) {
        results.push({
            isSpike: true,
            alertType: 'VOLTAGE_SPIKE',
            severity: reading.voltage > 265 ? 'HIGH' : 'MEDIUM',
            value: reading.voltage,
            message: `Voltage spike: ${reading.voltage.toFixed(1)}V exceeds ${thresholds.VOLTAGE_MAX}V limit. Check your electrical supply immediately.`,
        })
    }

    // ─── 2. Rapid voltage jump (≥10% between consecutive readings) ─────────
    if (recentReadings.length >= 1) {
        // recentReadings is ascending, so last element is the most recent previous
        const prev = recentReadings[recentReadings.length - 1]
        if (prev && prev.voltage > 0) {
            const jumpPct = Math.abs((reading.voltage - prev.voltage) / prev.voltage) * 100
            const alreadyFlagged = results.some(r => r.alertType === 'VOLTAGE_SPIKE')
            if (jumpPct >= thresholds.VOLTAGE_JUMP_PCT && !alreadyFlagged && reading.voltage > 50) {
                results.push({
                    isSpike: true,
                    alertType: 'VOLTAGE_SPIKE',
                    severity: 'HIGH',
                    value: reading.voltage,
                    message: `Rapid voltage fluctuation: ${jumpPct.toFixed(1)}% change detected (${prev.voltage.toFixed(1)}V → ${reading.voltage.toFixed(1)}V). Possible power surge or grid instability.`,
                })
            }
        }
    }

    // ─── 3. Current surge ──────────────────────────────────────────────────
    if (reading.current > thresholds.CURRENT_MAX) {
        results.push({
            isSpike: true,
            alertType: 'CURRENT_SURGE',
            severity: reading.current > thresholds.CURRENT_MAX * 1.5 ? 'HIGH' : 'MEDIUM',
            value: reading.current,
            message: `Current surge: ${reading.current.toFixed(2)}A exceeds ${thresholds.CURRENT_MAX}A threshold. Risk of circuit overload — disconnect high-draw appliances.`,
        })
    }

    // ─── 4. Anomalous power spike (vs recent moving average) ───────────────
    if (recentReadings.length >= 5) {
        // Newest 10 readings (end of ascending array = most recent)
        const recent10 = recentReadings.slice(-10)
        const avgPower = recent10.reduce((s, r) => s + r.power, 0) / recent10.length
        if (reading.power > avgPower * thresholds.POWER_SPIKE_RATIO && avgPower > 30) {
            const pctAbove = ((reading.power / avgPower) * 100 - 100).toFixed(0)
            results.push({
                isSpike: true,
                alertType: 'ANOMALY',
                severity: 'MEDIUM',
                value: reading.power,
                message: `Abnormal power spike: ${reading.power.toFixed(0)}W is ${pctAbove}% above the recent ${avgPower.toFixed(0)}W average. Unusual device activity suspected.`,
            })
        }
    }

    // ─── 5. Poor power factor ──────────────────────────────────────────────
    if (reading.pf !== undefined && reading.pf > 0 && reading.pf < thresholds.PF_MIN && reading.power > 100) {
        results.push({
            isSpike: true,
            alertType: 'ANOMALY',
            severity: 'LOW',
            value: reading.pf,
            message: `Poor power factor: PF=${reading.pf.toFixed(2)} (min: ${thresholds.PF_MIN}) at ${reading.power.toFixed(0)}W. Inductive load inefficiency — consider power factor correction.`,
        })
    }

    // ─── 6. Off-hours high consumption (10 PM – 5 AM) ─────────────────────
    const hour = ts.getHours()
    const isOffHours = hour >= 22 || hour < 5
    if (isOffHours && reading.power > thresholds.OFF_HOURS_POWER) {
        const timeStr = ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
        results.push({
            isSpike: true,
            alertType: 'ANOMALY',
            severity: 'LOW',
            value: reading.power,
            message: `Off-hours usage: ${reading.power.toFixed(0)}W at ${timeStr}. High consumption during off-peak hours (10 PM–5 AM) — check for appliances left on.`,
        })
    }

    // ─── 7. Power Outage / Low Voltage ─────────────────────────────────────
    if (reading.voltage < 50 && recentReadings.length >= 1) {
        const prev = recentReadings[recentReadings.length - 1]
        // Only trigger an outage alert if we suddenly drop from a healthy voltage
        if (prev && prev.voltage > 100) {
            results.push({
                isSpike: true,
                alertType: 'ANOMALY',
                severity: 'HIGH',
                value: reading.voltage,
                message: `Power outage detected! Voltage crashed from ${prev.voltage.toFixed(1)}V to ${reading.voltage.toFixed(1)}V.`,
            })
        }
    }

    return results
}
