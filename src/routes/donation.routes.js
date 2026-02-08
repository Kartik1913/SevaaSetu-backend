const express = require("express");
const Donation = require("../models/Donation");
const Need = require("../models/Need");

const router = express.Router();

router.post("/donate", async (req, res) => {
  const { userId, needId, amount } = req.body;

  await Donation.create({ userId, needId, amount });
  await Need.findByIdAndUpdate(needId, {
    $inc: { collectedAmount: amount },
  });

  res.json({ msg: "Donation successful" });
});

module.exports = router;
