import fetch from "node-fetch";

/**
 * Send a push notification via Expo
 * @param {string} expoPushToken - Token from the Expo app (starts with ExponentPushToken)
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 */
export async function sendPushNotification(expoPushToken, title, body) {
    try {
        const message = {
            to: expoPushToken,
            sound: "default",
            title,
            body,
            data: { someData: "goes here" },
        };

        const response = await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Accept-Encoding": "gzip, deflate",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(message),
        });

        const data = await response.json();
        console.log("Push response:", data);
        return data;
    } catch (error) {
        console.error("Error sending push notification:", error);
        throw error;
    }
}
