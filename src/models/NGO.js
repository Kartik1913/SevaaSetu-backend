const mongoose = require("mongoose");

const ngoSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    type: [String], // orphanage, old-age, disability
    city: String,
    state: String,
    verified: { type: Boolean, default: false },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("NGO", ngoSchema);
