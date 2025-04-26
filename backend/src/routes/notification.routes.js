const express = require("express");
const notificationController = require("../controllers/notification.controller");
const router = express.Router();

// Get user notifications
router.get("/", notificationController.getUserNotifications);

// Mark notification as read
router.patch(
  "/:notificationId/read",
  notificationController.markNotificationAsRead
);

// Mark all notifications as read
router.patch("/read-all", notificationController.markAllNotificationsAsRead);

module.exports = router;
