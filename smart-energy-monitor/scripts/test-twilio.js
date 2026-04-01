const twilio = require('twilio');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const from = process.env.TWILIO_PHONE_NUMBER;
const to = process.env.ALERT_TARGET_PHONE;

async function testSMS() {
    console.log(`Testing Twilio with SID: ${sid ? 'Present' : 'Missing'}`);
    
    if (!sid || !token || !from) {
        console.error('Missing Twilio credentials!');
        return;
    }

    const client = twilio(sid, token);
    
    try {
        const message = await client.messages.create({
            body: 'GridSense Test SMS - Quota Check',
            from: from,
            to: to
        });
        console.log('SUCCESS:', message.sid);
    } catch (err) {
        console.error('TWILIO ERROR:', JSON.stringify(err, null, 2));
    }
}

testSMS();
