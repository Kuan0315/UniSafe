export const sendPushNotification = async (user, notification) => {
    try {
        // This would integrate with Firebase Cloud Messaging or similar
        // For now, we'll just log it
        console.log(`Push notification to ${user.name}:`, notification);
        return true;
    } catch (error) {
        console.error('Error sending push notification:', error);
        return false;
    }
};

export default { sendPushNotification };