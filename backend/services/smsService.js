// services/smsService.js
import twilio from "twilio";

// Load credentials from environment
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

/**
 * Send SMS alert
 * @param {string} to - phone number of recipient
 * @param {string} message - text message content
 */
export const sendSMS = async (to, message) => {
    try {
        const response = await client.messages.create({
            body: message,
            from: fromNumber,
            to,
        });
        console.log("✅ SMS sent:", response.sid);
        return response;
    } catch (error) {
        console.error("❌ Error sending SMS:", error.message);
        throw error;
    }
};
