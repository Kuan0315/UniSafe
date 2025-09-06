// This would integrate with an SMS service like Twilio
// For now, we'll create a mock implementation

export const sendSMS = async (to, message) => {
    try {
        console.log(`SMS to ${to}: ${message}`);
        // In a real implementation, this would call the SMS service API
        return { success: true, message: 'SMS sent successfully' };
    } catch (error) {
        console.error('Error sending SMS:', error);
        throw error;
    }
};

export const sendEmergencySMS = async (contact, user, location, message = '') => {
    const smsMessage = `
    EMERGENCY: ${user.name} has triggered an SOS alert.
    Location: ${location.address || 'Unknown location'}
    Coordinates: ${location.lat}, ${location.lng}
    Time: ${new Date().toLocaleString()}
    ${message ? `Message: ${message}` : ''}
    
    Please check on them immediately or contact authorities if needed.
  `;

    return sendSMS(contact.phone, smsMessage);
};