import { NextRequest, NextResponse } from 'next/server'
import { sendAlertSMS, twilioClient } from '@/lib/notifications'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const customPhone = searchParams.get('phone')
        const targetPhone = process.env.ALERT_TARGET_PHONE
        
        console.log('[SMS Debug] Starting manual test...')
        
        const result = await sendAlertSMS(
            'DEBUG_TEST', 
            'INFO', 
            'GridSense Manual SMS debug test. If you see this, connectivity is OK!',
            customPhone || undefined
        )

        const env_check = {
            sid_present: !!process.env.TWILIO_ACCOUNT_SID,
            token_present: !!process.env.TWILIO_AUTH_TOKEN,
            from_phone_present: !!process.env.TWILIO_PHONE_NUMBER,
            target_phone_present: !!process.env.ALERT_TARGET_PHONE,
            target_phone_value: process.env.ALERT_TARGET_PHONE ? 'PROVIDED' : 'MISSING'
        }

        if (result.success) {
            return NextResponse.json({ 
                status: 'success', 
                message: 'Twilio accepted the message. Check your phone!',
                sid: result.sid,
                recipient: customPhone || targetPhone,
                env_check
            })
        } else {
            return NextResponse.json({ 
                status: 'failure', 
                twilio_error: result.error,
                info: 'Common causes: 1) Unverified number (if trial account), 2) Geo-Permissions for India not enabled, 3) Missing Vercel environment variables, 4) Incorrect SID/Token.',
                env_check
            }, { status: 500 })
        }
    } catch (err: any) {
        return NextResponse.json({ 
            status: 'error', 
            error: err.message,
            stack: err.stack
        }, { status: 500 })
    }
}
