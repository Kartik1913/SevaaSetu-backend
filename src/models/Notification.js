const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["app_update", "new_application", "mission_completed", "system"],
      default: "system",
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId, // Could be Opportunity or Application depending on context
      refPath: "onModel",
    },
    onModel: {
      type: String,
      enum: ["Opportunity", "Application"],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
