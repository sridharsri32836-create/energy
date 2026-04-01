const { Resend } = require('resend');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const resend = new Resend(process.env.RESEND_API_KEY);
const targetEmail = process.env.ALERT_TARGET_EMAIL;

async function testEmail() {
    console.log(`Testing Resend with key: ${process.env.RESEND_API_KEY ? 'Present' : 'Missing'}`);
    console.log(`Target Email: ${targetEmail}`);
    
    try {
        const { data, error } = await resend.emails.send({
            from: 'GridSense Reports <onboarding@resend.dev>',
            to: targetEmail,
            subject: 'Test Report from GridSense',
            html: '<p>Test successful!</p>'
        });
        if (error) {
            console.error('RESEND ERROR:', JSON.stringify(error, null, 2));
        } else {
            console.log('SUCCESS:', JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error('CATCH ERROR:', err);
    }
}

testEmail();
