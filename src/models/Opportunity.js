const mongoose = require("mongoose");

const opportunitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      enum: ["Education", "Environment", "Health", "Social Welfare"],
      required: true,
    },

    commitment: {
      type: String,
      enum: ["Flexible", "Weekends", "Weekdays", "Monthly"],
      required: true,
    },

    skills: [String],

    ngo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    onboarding: {
      locationUrl: String,
      dateTime: Date,
      contactPerson: String,
      instructions: String,
      whatsappGroup: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    checkInActive: {
      type: Boolean,
      default: false,
    },
    checkInCode: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Opportunity", opportunitySchema);