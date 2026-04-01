import { NextRequest, NextResponse } from 'next/server'
import { sendAlertSMS, twilioClient } from '@/lib/notifications'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const customPhone = searchParams.get('phone')
        
        console.log('[SMS Debug] Starting manual test...')
        
        const result = await sendAlertSMS(
            'DEBUG_TEST', 
            'INFO', 
            'This is a GridSense manual SMS debug test message.',
            customPhone || undefined
        )

        if (result.success) {
            return NextResponse.json({ 
                status: 'success', 
                message: 'Twilio accepted the message. Check your phone!',
                sid: result.sid,
                recipient: customPhone || process.env.ALERT_TARGET_PHONE
            })
        } else {
            // If it failed, let's try to get more direct info for the user
            const sid_env = process.env.TWILIO_ACCOUNT_SID ? 'PRESENT' : 'MISSING'
            const token_env = process.env.TWILIO_AUTH_TOKEN ? 'PRESENT' : 'MISSING'
            
            return NextResponse.json({ 
                status: 'failure', 
                twilio_error: result.error,
                info: 'Common causes: Unverified number, Geo-Permissions, or missing Vercel environment variables.',
                env_check: { sid_env, token_env }
            }, { status: 500 })
        }
    } catch (err: any) {
        return NextResponse.json({ 
            status: 'error', 
            error: err.message 
        }, { status: 500 })
    }
}
