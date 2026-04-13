import Notification from "../../models/notification.model.js";

export const getNotifications = async (req, res) => {
    try {
        const recipientId = req.user?.user || req.owner?.id;
        const recipientModel = req.user ? 'User' : 'Owner';

        if (!recipientId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const notifications = await Notification.find({
            recipient: recipientId,
            recipientModel: recipientModel
        }).sort({ createdAt: -1 }).limit(50);

        return res.status(200).json(notifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return res.status(500).json({ message: "Error fetching notifications" });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const recipientId = req.user?.user || req.owner?.id;

        if (!recipientId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, recipient: recipientId },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        return res.status(200).json({ success: true, notification });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return res.status(500).json({ message: "Error updating notification" });
    }
};

export const markAllAsRead = async (req, res) => {
    try {
        const recipientId = req.user?.user || req.owner?.id;
        const recipientModel = req.user ? 'User' : 'Owner';

        if (!recipientId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        await Notification.updateMany(
            { recipient: recipientId, recipientModel: recipientModel, isRead: false },
            { isRead: true }
        );

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error marking all as read:", error);
        return res.status(500).json({ message: "Error updating notifications" });
    }
};
