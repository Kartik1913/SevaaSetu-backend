const express = require("express");
const mongoose = require("mongoose");
const Opportunity = require("../models/Opportunity");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// NGO creates opportunity
router.post("/create", authMiddleware, async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("USER:", req.user);

    if (req.user.role !== "ngo") {
      return res.status(403).json({ message: "Only NGOs can create opportunities" });
    }

    const opportunity = await Opportunity.create({
      title: req.body.title,
      description: req.body.description,
      location: req.body.location,
      category: req.body.category,
      commitment: req.body.commitment,
      skills: req.body.skills,
      ngo: req.user.userId,
    });

    console.log("SAVED:", opportunity);

    res.status(201).json(opportunity);
  } catch (err) {
    console.error("CREATE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// Public list
router.get("/list", async (req, res) => {
  const opportunities = await Opportunity.find({ isActive: true })
    .populate("ngo", "firstName ngoVerified logo");

  res.json(opportunities);
});

const Application = require("../models/Application");

router.get("/my", authMiddleware, async (req, res) => {
  if (req.user.role !== "ngo") {
    return res.status(403).json({ message: "Only NGOs allowed" });
  }

  try {
    const opportunities = await Opportunity.find({
      ngo: req.user.userId,
    });

    const oppWithCounts = await Promise.all(
      opportunities.map(async (opp) => {
        const totalApplicants = await Application.countDocuments({
          opportunity: opp._id,
        });

        const accepted = await Application.countDocuments({
          opportunity: opp._id,
          status: "accepted",
        });

        const pending = await Application.countDocuments({
          opportunity: opp._id,
          status: "pending",
        });

        return {
          ...opp.toObject(),
          totalApplicants,
          accepted,
          pending,
        };
      })
    );

    res.json(oppWithCounts);
  } catch (err) {
    console.error("MY OPP ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;