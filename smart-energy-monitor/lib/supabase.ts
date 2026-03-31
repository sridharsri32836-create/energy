import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser/client-side singleton
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client with service role (for API routes)
export function createServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )
}

export type MeterReading = {
    id: string
    voltage: number
    current: number
    power: number
    energy_kwh: number
    timestamp: string
}

export type DailyUsage = {
    date: string
    total_energy_kwh: number
    estimated_cost: number
}

export type Alert = {
    id: string
    alert_type: 'VOLTAGE_SPIKE' | 'CURRENT_SURGE' | 'ANOMALY'
    value: number
    message: string
    is_read: boolean
    timestamp: string
}

export type Prediction = {
    date: string
    predicted_energy: number
    predicted_cost: number
    created_at: string
}
