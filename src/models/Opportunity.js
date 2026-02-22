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
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Opportunity", opportunitySchema);