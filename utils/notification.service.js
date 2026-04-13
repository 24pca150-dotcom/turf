import Notification from "../models/notification.model.js";
import { getIO } from "../server.js";
import admin from "firebase-admin";

// Firebase initialization (Optional - if config exists)
let fcmEnabled = false;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        fcmEnabled = true;
    } catch (error) {
        console.error("Firebase Admin initialization failed:", error.message);
    }
}

/**
 * Send notification to a specific user/owner
 * @param {Object} data - Notification data
 * @param {string} data.recipient - Recipient ID
 * @param {string} data.recipientModel - 'User' or 'Owner'
 * @param {string} data.title - Title
 * @param {string} data.message - Message
 * @param {string} data.type - 'booking', 'cancellation', etc.
 * @param {string} [data.bookingId] - Optional booking ID
 * @param {string} [data.sender] - Optional sender ID
 * @param {string} [data.senderModel] - Optional 'User' or 'Owner'
 * @param {string} [data.fcmToken] - Optional FCM token for push notifications
 */
export const sendNotification = async (data) => {
    try {
        // 1. Save to Database (In-App)
        const notification = new Notification({
            recipient: data.recipient,
            recipientModel: data.recipientModel,
            sender: data.sender,
            senderModel: data.senderModel,
            title: data.title,
            message: data.message,
            type: data.type,
            bookingId: data.bookingId,
        });
        await notification.save();

        // 2. Emit Real-Time via Socket.io
        const io = getIO();
        if (io) {
            // Room name pattern: user_<id> or owner_<id>
            const roomName = `${data.recipientModel.toLowerCase()}_${data.recipient}`;
            io.to(roomName).emit("notification", notification);
            console.log(`Socket emitted to room ${roomName}: ${data.title}`);
        }

        // 3. Send Push Notification (FCM)
        if (fcmEnabled && data.fcmToken) {
            const message = {
                notification: {
                    title: data.title,
                    body: data.message,
                },
                token: data.fcmToken,
            };
            await admin.messaging().send(message);
            console.log("Push notification sent successfully");
        }

        return notification;
    } catch (error) {
        console.error("Notification delivery failed:", error);
        // We don't throw error to avoid blocking the main flow
    }
};
