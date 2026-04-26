const express = require("express");
const Application = require("../models/Application");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// Get certificate data for a completed application (authenticated)
router.get("/my/:applicationId", authMiddleware, async (req, res) => {
  if (req.user.role !== "volunteer") {
    return res.status(403).json({ message: "Only volunteers can view certificates" });
  }

  try {
    const application = await Application.findOne({
      _id: req.params.applicationId,
      volunteer: req.user.userId,
      status: "completed",
    })
      .populate("opportunity", "title category location commitment onboarding createdAt")
      .populate({
        path: "opportunity",
        populate: {
          path: "ngo",
          select: "firstName lastName",
        },
      })
      .populate("volunteer", "firstName lastName email");

    if (!application) {
      return res.status(404).json({ message: "Certificate not found or mission not completed" });
    }

    const certData = {
      certificateId: `SEVA-${application._id.toString().slice(-8).toUpperCase()}`,
      volunteerName: `${application.volunteer.firstName || ""} ${application.volunteer.lastName || ""}`.trim(),
      volunteerEmail: application.volunteer.email,
      opportunityTitle: application.opportunity.title,
      ngoName: application.opportunity.ngo?.firstName || "SevaaSetu Partner NGO",
      category: application.opportunity.category,
      location: application.opportunity.location,
      completedDate: application.updatedAt,
      hours: 3, // Default hours per mission
      applicationId: application._id,
    };

    res.json(certData);
  } catch (err) {
    console.error("CERTIFICATE FETCH ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Public certificate verification
router.get("/verify/:certId", async (req, res) => {
  try {
    // Extract the application ID from the certificate ID
    const certIdSuffix = req.params.certId.replace("SEVA-", "");

    const applications = await Application.find({ status: "completed" })
      .populate("opportunity", "title category")
      .populate({
        path: "opportunity",
        populate: {
          path: "ngo",
          select: "firstName",
        },
      })
      .populate("volunteer", "firstName lastName");

    const application = applications.find(
      (app) => app._id.toString().slice(-8).toUpperCase() === certIdSuffix
    );

    if (!application) {
      return res.status(404).json({ valid: false, message: "Certificate not found" });
    }

    res.json({
      valid: true,
      volunteerName: `${application.volunteer.firstName || ""} ${application.volunteer.lastName || ""}`.trim(),
      opportunityTitle: application.opportunity.title,
      ngoName: application.opportunity.ngo?.firstName || "SevaaSetu Partner NGO",
      completedDate: application.updatedAt,
      certificateId: `SEVA-${application._id.toString().slice(-8).toUpperCase()}`,
    });
  } catch (err) {
    console.error("VERIFY ERROR:", err);
    res.status(500).json({ valid: false, message: "Server error" });
  }
});

module.exports = router;
