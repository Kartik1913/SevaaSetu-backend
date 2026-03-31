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
      onboarding: req.body.onboarding,
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
        // Parallelize MongoDB Queries to massively reduce loop wait time
        const [totalApplicants, accepted, pending] = await Promise.all([
          Application.countDocuments({ opportunity: opp._id }),
          Application.countDocuments({ opportunity: opp._id, status: "accepted" }),
          Application.countDocuments({ opportunity: opp._id, status: "pending" })
        ]);

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

// GET single mission details for NGO dashboard
router.get("/mission/:id", authMiddleware, async (req, res) => {
  if (req.user.role !== "ngo") {
    return res.status(403).json({ message: "Only NGOs allowed" });
  }

  try {
    const opp = await Opportunity.findById(req.params.id);
    if (!opp) return res.status(404).json({ message: "Not found" });

    // Security check
    if (opp.ngo.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json(opp);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// PUT Check-in control
router.put("/mission/:id/checkin", authMiddleware, async (req, res) => {
  if (req.user.role !== "ngo") {
    return res.status(403).json({ message: "Only NGOs allowed" });
  }

  try {
    const opp = await Opportunity.findById(req.params.id);
    if (!opp) return res.status(404).json({ message: "Not found" });

    if (opp.ngo.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { action } = req.body; // "start", "stop", or "regenerate"

    if (action === "start") {
      opp.checkInActive = true;
      opp.checkInCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    } else if (action === "stop") {
      opp.checkInActive = false;
      opp.checkInCode = "";
    } else if (action === "regenerate") {
       opp.checkInCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    } else if (action === "end") {
       opp.checkInActive = false;
       opp.checkInCode = "";
       opp.isActive = false; // Officially end the mission
       
       // Automatically mark anyone still "accepted" as "absent"
       await Application.updateMany(
         { opportunity: opp._id, status: "accepted" },
         { $set: { status: "absent" } }
       );
    }

    await opp.save();
    res.json(opp);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


// PUT Edit Mission details
router.put("/edit/:id", authMiddleware, async (req, res) => {
  if (req.user.role !== "ngo") {
    return res.status(403).json({ message: "Only NGOs allowed" });
  }

  try {
    const opp = await Opportunity.findById(req.params.id);
    if (!opp) return res.status(404).json({ message: "Not found" });

    if (opp.ngo.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Update allowable fields
    const { title, description, location, category, commitment, skills, onboarding } = req.body;
    
    if (title) opp.title = title;
    if (description) opp.description = description;
    if (location) opp.location = location;
    if (category) opp.category = category;
    if (commitment) opp.commitment = commitment;
    if (skills) opp.skills = skills;
    if (onboarding) opp.onboarding = onboarding;

    await opp.save();
    
    // Send back fully populated opportunity just in case frontend needs it (though it might just need basic fields)
    res.json(opp);
  } catch (err) {
    console.error("EDIT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;