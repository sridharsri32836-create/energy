import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@/lib/supabase/server';
import { sendUsageReport } from '@/lib/notifications';

export async function POST(req: Request) {
    try {
        const { type } = await req.json();
        const supabase = await createServiceClient();

        // Get the current user to send the email to them
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) {
            return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
        }

        let startDate = new Date();
        let endDate = new Date();
        let totalKwh = 0;
        let totalCost = 0;

        if (type === 'DAILY') {
            startDate.setDate(startDate.getDate() - 1);
            const { data } = await supabase
                .from('daily_usage')
                .select('*')
                .eq('date', startDate.toISOString().split('T')[0])
                .single();
            
            if (data) {
                totalKwh = data.total_energy_kwh;
                totalCost = data.estimated_cost;
            } else {
                // Fallback for demo if no real data
                totalKwh = 12.5;
                totalCost = 87.5;
            }
        } else if (type === 'WEEKLY') {
            startDate.setDate(startDate.getDate() - 7);
            const { data } = await supabase
                .from('daily_usage')
                .select('total_energy_kwh, estimated_cost')
                .gte('date', startDate.toISOString().split('T')[0])
                .lte('date', endDate.toISOString().split('T')[0]);
            
            if (data && data.length > 0) {
                totalKwh = data.reduce((acc, curr) => acc + curr.total_energy_kwh, 0);
                totalCost = data.reduce((acc, curr) => acc + curr.estimated_cost, 0);
            } else {
                totalKwh = 85.2;
                totalCost = 596.4;
            }
        } else if (type === 'MONTHLY') {
            // Specifically use March data for the demo as requested
            startDate = new Date('2026-03-01');
            endDate = new Date('2026-03-31');
            const { data } = await supabase
                .from('daily_usage')
                .select('total_energy_kwh, estimated_cost')
                .gte('date', '2026-03-01')
                .lte('date', '2026-03-31');
            
            if (data && data.length > 0) {
                totalKwh = data.reduce((acc, curr) => acc + curr.total_energy_kwh, 0);
                totalCost = data.reduce((acc, curr) => acc + curr.estimated_cost, 0);
            } else {
                totalKwh = 342.8;
                totalCost = 2399.6;
            }
        }

        const { data: resendData, error: resendError } = await sendUsageReport(type, {
            total_kwh: totalKwh,
            cost: totalCost,
            peak_usage: 3200, // Simulated peak
            average_voltage: 245.2,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        }, user.email);

        const reportPayload = {
            type,
            totalKwh,
            totalCost,
            peakUsage: 3200,
            averageVoltage: 245.2,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        };

        if (resendError) {
            console.error('Email failed but calculation succeeded:', resendError);
            return NextResponse.json({ 
                success: true, // Calculation succeeded
                emailSent: false,
                error: resendError === 'daily_quota_exceeded' ? 'Daily quota exceeded' : 'External error',
                data: reportPayload,
                message: 'Report calculated but email quota exceeded. Showing preview...'
            });
        }

        return NextResponse.json({ 
            success: true, 
            emailSent: true,
            data: reportPayload,
            message: `${type} report sent successfully!` 
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
