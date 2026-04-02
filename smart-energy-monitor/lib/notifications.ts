import { Resend } from 'resend';
import twilio from 'twilio';

// Initialize Services
export const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY.trim()) : null;

const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
const token = process.env.TWILIO_AUTH_TOKEN?.trim();

export const twilioClient = (sid && token) ? twilio(sid, token) : null;

// Ensure we have targets
const targetEmail = process.env.ALERT_TARGET_EMAIL;
const targetPhone = process.env.ALERT_TARGET_PHONE;
const twilioFromPhone = process.env.TWILIO_PHONE_NUMBER;
const twilioLogPrefix = '[Twilio SMS]';

/**
 * Normalizes phone numbers to E.164 format for Twilio.
 * Trims whitespace and ensures a leading '+' is present.
 */
function normalizePhoneNumber(phone: string): string {
    const trimmed = phone.trim().replace(/\s/g, '');
    if (!trimmed.startsWith('+')) {
        // Assume Indian numbers if no '+' and 10 digits, or just prepend '+' if user forgot
        if (trimmed.length === 10) return `+91${trimmed}`;
        return `+${trimmed}`;
    }
    return trimmed;
}

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
    const finalPhone = normalizePhoneNumber(customTargetPhone || targetPhone || '');
    if (!twilioClient || !twilioFromPhone) {
        console.warn(`${twilioLogPrefix} Credentials or phone number not defined. Skipping SMS alert.`);
        return { success: false, error: { message: 'Credentials or phone number not defined' } };
    }
    if (!finalPhone || finalPhone === '+') {
        console.warn(`${twilioLogPrefix} No valid target phone defined. Skipping SMS alert.`);
        return { success: false, error: { message: 'No valid target phone defined' } };
    }

    try {
        console.log(`${twilioLogPrefix} Attempting to send to ${finalPhone} from ${twilioFromPhone}...`);
        const smsResponse = await twilioClient.messages.create({
            body: `GridSense 🚨 ${severity} ALERT: ${message}`,
            from: twilioFromPhone,
            to: finalPhone,
        });

        console.log(`${twilioLogPrefix} SUCCESS! SID: ${smsResponse.sid}`);
        return { success: true, sid: smsResponse.sid };
    } catch (err: any) {
        // Log deep details for console
        const errorDetails = {
            message: err.message,
            code: err.code,
            status: err.status,
            moreInfo: err.moreInfo,
            target: finalPhone,
            from: twilioFromPhone
        };
        console.error(`${twilioLogPrefix} CRITICAL DELIVERY FAILURE:`, JSON.stringify(errorDetails, null, 2));
        return { success: false, error: errorDetails };
    }
}
export async function sendUsageReport(type: 'DAILY' | 'WEEKLY' | 'MONTHLY', reportData: {
    total_kwh: number,
    cost: number,
    peak_usage?: number,
    average_voltage?: number,
    startDate?: string,
    endDate?: string
}, customTargetEmail?: string) {
    const finalEmail = customTargetEmail || targetEmail;
    if (!resend) return { data: null, error: 'no_api_key' };
    if (!finalEmail) return { data: null, error: 'no_target_email' };

    const title = `${type.charAt(0) + type.slice(1).toLowerCase()} Energy Report`;
    const period = reportData.startDate && reportData.endDate 
        ? `${new Date(reportData.startDate).toLocaleDateString()} - ${new Date(reportData.endDate).toLocaleDateString()}`
        : new Date().toLocaleDateString();

    try {
        const { data: resendData, error } = await resend.emails.send({
            from: 'GridSense Reports <onboarding@resend.dev>',
            to: finalEmail,
            subject: `📊 ${title} - ${period}`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
                    <div style="background-color: #2563eb; padding: 30px 20px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">GridSense Energy</h1>
                        <p style="color: #bfdbfe; margin: 5px 0 0 0;">${title}</p>
                    </div>
                    <div style="padding: 30px; background-color: white;">
                        <p style="font-size: 16px; color: #374151; margin-bottom: 25px;">Hello! Here is your energy consumption summary for the period of <strong>${period}</strong>.</p>
                        
                        <div style="display: flex; justify-content: space-between; margin-bottom: 30px; flex-wrap: wrap; gap: 15px;">
                            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; flex: 1; min-width: 120px; text-align: center;">
                                <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 5px;">Usage</div>
                                <div style="font-size: 20px; font-weight: bold; color: #111827;">${reportData.total_kwh.toFixed(2)} kWh</div>
                            </div>
                            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; flex: 1; min-width: 120px; text-align: center;">
                                <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 5px;">Cost</div>
                                <div style="font-size: 20px; font-weight: bold; color: #059669;">₹${reportData.cost.toFixed(2)}</div>
                            </div>
                        </div>

                        ${reportData.peak_usage ? `
                        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
                            <h3 style="font-size: 14px; color: #111827; margin-bottom: 10px;">Insights</h3>
                            <ul style="padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.6;">
                                <li>Peak power monitored: <strong>${reportData.peak_usage.toFixed(0)}W</strong></li>
                                <li>Average system voltage: <strong>${reportData.average_voltage?.toFixed(1) || '245.0'}V</strong></li>
                                <li>Efficiency status: <span style="color: #059669; font-weight: 500;">Optimal</span></li>
                            </ul>
                        </div>
                        ` : ''}

                        <div style="margin-top: 40px; text-align: center;">
                            <a href="#" style="background-color: #2563eb; color: white; padding: 12px 25px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">View Full Dashboard</a>
                        </div>
                    </div>
                    <div style="padding: 20px; text-align: center; background-color: #f3f4f6;">
                        <p style="font-size: 12px; color: #9ca3af; margin:0;">
                            GridSense Smart Monitor · Sent to ${finalEmail}<br/>
                            This is an automated report to help you track energy efficiency.
                        </p>
                    </div>
                </div>
            `,
        });

        if (error) {
            console.error('Resend API Error:', error);
            // Check for quota error string specifically
            const errorMsg = (error as any).message || '';
            const isQuotaError = errorMsg.toLowerCase().includes('quota') || (error as any).status === 429;
            return { data: null, error: isQuotaError ? 'daily_quota_exceeded' : 'send_failed' };
        }

        console.log('Usage report sent successfully:', resendData);
        return { data: resendData, error: null };
    } catch (err) {
        console.error('Failed to send usage report:', err);
        return { data: null, error: 'internal_error' };
    }
}
