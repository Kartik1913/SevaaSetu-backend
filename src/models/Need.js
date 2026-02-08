const mongoose = require("mongoose");

const needSchema = new mongoose.Schema({
  ngoId: { type: mongoose.Schema.Types.ObjectId, ref: "NGO" },
  title: String,
  description: String,
  requiredAmount: Number,
  collectedAmount: { type: Number, default: 0 },
  status: { type: String, default: "Open" },
});

module.exports = mongoose.model("Need", needSchema);
