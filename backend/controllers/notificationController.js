// controllers/notificationController.js
import Notification from "../models/Notification.js";

// Create a new notification
export const createNotification = async (req, res) => {
    try {
        const { userId, message, type } = req.body;

        const notification = new Notification({ userId, message, type });
        await notification.save();

        res.status(201).json({
            success: true,
            message: "Notification created successfully",
            data: notification,
        });
    } catch (error) {
        console.error("Error creating notification:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// Get notifications for a specific user
export const getUserNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: notifications });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findByIdAndUpdate(id, { read: true }, { new: true });

        if (!notification)
            return res.status(404).json({ success: false, message: "Notification not found" });

        res.status(200).json({ success: true, message: "Notification marked as read", data: notification });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// Delete a notification
export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findByIdAndDelete(id);

        if (!notification)
            return res.status(404).json({ success: false, message: "Notification not found" });

        res.status(200).json({ success: true, message: "Notification deleted successfully" });
    } catch (error) {
        console.error("Error deleting notification:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ✅ Get basic notification stats (for dashboard)
export const getNotificationStats = async (req, res) => {
    try {
        const total = await Notification.countDocuments();
        const unread = await Notification.countDocuments({ read: false });

        res.status(200).json({
            success: true,
            data: { total, unread },
        });
    } catch (error) {
        console.error("Error fetching notification stats:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};
