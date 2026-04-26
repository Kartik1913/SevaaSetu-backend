const express = require("express");
const Notification = require("../models/Notification");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// Get all notifications for the logged-in user
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.userId })
      .sort({ createdAt: -1 })
      // Limit to last 50 notifications
      .limit(50);
      
    res.json(notifications);
  } catch (err) {
    console.error("FETCH NOTIFICATIONS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark a specific notification as read
router.put("/read/:id", authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.userId },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    res.json(notification);
  } catch (err) {
    console.error("READ NOTIFICATION ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark all notifications as read
router.put("/read-all", authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.userId, isRead: false },
      { isRead: true }
    );
    
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("READ ALL NOTIFICATIONS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
