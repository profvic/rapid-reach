const Notification = require("../models/notification.model");
const { successResponse, errorResponse } = require("../utils/apiResponse");

// Get user notifications
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.userId;

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50); // Limit to recent notifications

    return successResponse(
      res,
      notifications,
      "Notifications retrieved successfully"
    );
  } catch (error) {
    console.error("Error retrieving notifications:", error);
    return errorResponse(res, "Failed to retrieve notifications", 500, error);
  }
};

// Mark notification as read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.userId;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      {
        $set: {
          status: "read",
          readAt: Date.now(),
        },
      },
      { new: true }
    );

    if (!notification) {
      return errorResponse(res, "Notification not found", 404);
    }

    return successResponse(res, notification, "Notification marked as read");
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return errorResponse(
      res,
      "Failed to mark notification as read",
      500,
      error
    );
  }
};

// Mark all notifications as read
exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.userId;

    const result = await Notification.updateMany(
      { userId, status: { $ne: "read" } },
      {
        $set: {
          status: "read",
          readAt: Date.now(),
        },
      }
    );

    return successResponse(
      res,
      { updatedCount: result.nModified },
      "All notifications marked as read"
    );
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return errorResponse(
      res,
      "Failed to mark all notifications as read",
      500,
      error
    );
  }
};
