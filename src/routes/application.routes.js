const express = require("express");
const Application = require("../models/Application");
const Opportunity = require("../models/Opportunity");
const authMiddleware = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const router = express.Router();

// Volunteer applies
router.post("/apply/:id", authMiddleware, async (req, res) => {
  if (req.user.role !== "volunteer") {
    return res.status(403).json({ message: "Only volunteers can apply" });
  }

  try {
    const opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity) {
      return res.status(404).json({ message: "Opportunity not found" });
    }

    const existing = await Application.findOne({
      volunteer: req.user.userId,
      opportunity: req.params.id,
    });

    if (existing) {
      return res.status(400).json({ message: "Already applied" });
    }

    const application = await Application.create({
      volunteer: req.user.userId,
      opportunity: req.params.id,
    });

    res.status(201).json(application);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// NGO fetch applications for an opportunity
router.get("/ngo/:opportunityId", authMiddleware, async (req, res) => {
  if (req.user.role !== "ngo") {
    return res.status(403).json({ message: "Only NGOs allowed" });
  }

  try {
    const applications = await Application.find({
      opportunity: req.params.opportunityId,
    }).populate("volunteer", "firstName email").populate("opportunity", "title");

    res.json(applications);
  } catch (err) {
    console.error("FETCH APPS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// NGO updates application status
router.put("/status/:applicationId", authMiddleware, async (req, res) => {
  if (req.user.role !== "ngo") {
    return res.status(403).json({ message: "Only NGOs allowed" });
  }

  try {
    const { status } = req.body;

    const updated = await Application.findByIdAndUpdate(
      req.params.applicationId,
      { status },
      { new: true }
    ).populate("volunteer", "firstName email");

    res.json(updated);
  } catch (err) {
    console.error("STATUS UPDATE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Volunteer fetch their applications
router.get("/my", authMiddleware, async (req, res) => {
  if (req.user.role !== "volunteer") {
    return res.status(403).json({ message: "Only volunteers allowed" });
  }

  try {
    const applications = await Application.find({
      volunteer: req.user.userId,
    })
      .populate("opportunity", "title category location commitment onboarding needs skills")
      .populate({
        path: "opportunity",
        populate: {
          path: "ngo",
          select: "firstName",
        },
      });

    res.json(applications);
  } catch (err) {
    console.error("VOLUNTEER FETCH ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get(
  "/ngo",
  authMiddleware,
  allowRoles("ngo"),
  async (req, res) => {
    try {
      const Opportunity = require("../models/Opportunity");

      // Single query: get opportunity IDs, then fetch all applications in one go
      const opportunityIds = await Opportunity.find({
        ngo: req.user.userId,
      }).distinct("_id");

      const applications = await Application.find({
        opportunity: { $in: opportunityIds },
      })
        .populate("volunteer", "firstName")
        .populate("opportunity", "title")
        .sort({ createdAt: -1 })
        .lean();

      res.json(applications);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Volunteer QR Check-in Endpoint
router.post("/checkin/:code", authMiddleware, async (req, res) => {
  if (req.user.role !== "volunteer") {
     return res.status(403).json({ message: "Only registered volunteers can check in" });
  }
  
  try {
    const opp = await Opportunity.findOne({ checkInCode: req.params.code, checkInActive: true });
    
    if (!opp) {
       return res.status(404).json({ message: "Check-in is not active or the code is invalid." });
    }

    const application = await Application.findOne({
      opportunity: opp._id,
      volunteer: req.user.userId,
    });

    if (!application) return res.status(400).json({ message: "You have not applied for this mission." });
    if (application.status === "completed") return res.status(400).json({ message: "You have already checked in!" });
    if (application.status !== "accepted") return res.status(400).json({ message: "You must be officially accepted by the NGO before checking in." });

    application.status = "completed";
    await application.save();

    res.json({ message: "Check-in successful!", opportunityTitle: opp.title });
  } catch (err) {
    console.error("CHECKIN ERROR", err);
    res.status(500).json({ message: "Server error during check-in" });
  }
});

module.exports = router;