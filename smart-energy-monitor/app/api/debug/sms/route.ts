import { NextRequest, NextResponse } from 'next/server'
import { sendAlertSMS, twilioClient } from '@/lib/notifications'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const customPhone = searchParams.get('phone')
        
        console.log('[SMS Debug] Starting manual test...')
        
        const success = await sendAlertSMS(
            'DEBUG_TEST', 
            'INFO', 
            'This is a GridSense manual SMS debug test message.',
            customPhone || undefined
        )

        if (success) {
            return NextResponse.json({ 
                status: 'success', 
                message: 'Twilio accepted the message. Check your phone!',
                recipient: customPhone || process.env.ALERT_TARGET_PHONE
            })
        } else {
            // If it failed, let's try to get more direct info for the user
            const sid = process.env.TWILIO_ACCOUNT_SID ? 'SID_PRESENT' : 'SID_MISSING'
            const token = process.env.TWILIO_AUTH_TOKEN ? 'TOKEN_PRESENT' : 'TOKEN_MISSING'
            const phone = process.env.TWILIO_PHONE_NUMBER ? 'PHONE_PRESENT' : 'PHONE_MISSING'
            
            return NextResponse.json({ 
                status: 'failure', 
                error: 'Check server logs for [Twilio SMS] prefix. Common causes: Unverified number, Geo-Permissions, or missing Vercel environment variables.',
                env_check: { sid, token, phone }
            }, { status: 500 })
        }
    } catch (err: any) {
        return NextResponse.json({ 
            status: 'error', 
            error: err.message 
        }, { status: 500 })
    }
}
