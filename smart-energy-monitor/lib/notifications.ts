import { Resend } from 'resend';
import twilio from 'twilio';

// Initialize Services
export const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const twilioClient = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

// Ensure we have targets
const targetEmail = process.env.ALERT_TARGET_EMAIL;
const targetPhone = process.env.ALERT_TARGET_PHONE;
const twilioFromPhone = process.env.TWILIO_PHONE_NUMBER;

export async function sendAlertEmail(alertType: string, severity: string, message: string, customTargetEmail?: string) {
    const finalEmail = customTargetEmail || targetEmail;
    if (!resend) {
        console.warn('RESEND_API_KEY is not defined. Skipping email alert.');
        return false;
    }
    if (!finalEmail) {
        console.warn('No target email defined. Skipping email alert.');
        return false;
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'Smart Energy Monitor <onboarding@resend.dev>', // You must verify a domain in Resend to change this
            to: finalEmail,
            subject: `🚨 ${severity} Alert: ${alertType.replace('_', ' ')} Detected`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <h2 style="color: #ef4444; margin-top: 0;">Critical Energy Alert</h2>
                    <p style="font-size: 16px; color: #374151;">Your smart energy monitor has detected a high-severity event that requires your immediate attention.</p>
                    <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 20px 0;">
                        <strong style="color: #991b1b; display: block; margin-bottom: 4px;">Alert Details:</strong>
                        <span style="color: #7f1d1d;">${message}</span>
                    </div>
                    <p style="font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 16px; margin-bottom: 0;">
                        Stay safe!<br />
                        — Your Smart GridSense Monitor
                    </p>
                </div>
            `,
        });

        if (error) {
            console.error('Failed to send Resend email:', error);
            return false;
        }

        console.log('Email alert sent successfully:', data);
        return true;
    } catch (err) {
        console.error('Failed to execute email send:', err);
        return false;
    }
}

export async function sendAlertSMS(alertType: string, severity: string, message: string, customTargetPhone?: string) {
    const finalPhone = customTargetPhone || targetPhone;
    if (!twilioClient || !twilioFromPhone) {
        console.warn('Twilio credentials or phone number not defined. Skipping SMS alert.');
        return false;
    }
    if (!finalPhone) {
        console.warn('No target phone defined. Skipping SMS alert.');
        return false;
    }

    try {
        const smsResponse = await twilioClient.messages.create({
            body: `GridSense 🚨 ${severity} ALERT: ${message}`,
            from: twilioFromPhone,
            to: finalPhone,
        });

        console.log('SMS alert sent successfully (SID):', smsResponse.sid);
        return true;
    } catch (err) {
        console.error('Failed to send SMS via Twilio:', err);
        return false;
    }
}
