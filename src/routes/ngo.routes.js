const express = require("express");
const NGO = require("../models/NGO");
const authMiddleware = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const router = express.Router();
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const storage = multer.memoryStorage();

const upload = multer({ storage });
/**
 * ================================
 * CREATE NGO
 * Only logged-in users with role = NGO
 * ================================
 */
router.post(
  "/create",
  authMiddleware,
  allowRoles("ngo"),
  async (req, res) => {
    try {
      const ngo = await NGO.create({
        ...req.body,
        createdBy: req.user.userId, // ✅ correct field
      });

      res.status(201).json({
        message: "NGO created successfully",
        ngo,
      });
    } catch (error) {
      console.error("NGO CREATE ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * ✅ GET MY NGO PROFILE (NGO only)
 * 👉 THIS IS THE OPTIONAL PART
 */
router.get(
  "/my",
  authMiddleware,
  allowRoles("ngo"),
  async (req, res) => {
    try {
      const ngo = await NGO.findOne({ createdBy: req.user.userId });

      if (!ngo) {
        return res.status(404).json({ message: "NGO not found" });
      }

      res.json(ngo);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * ================================
 * LIST VERIFIED NGOs (PUBLIC)
 * ================================
 */
router.get("/list", async (req, res) => {
  try {
    const User = require("../models/User");

    const ngos = await User.find({
      role: "ngo",
    }).select("firstName city category ngoVerified createdAt logo");

    res.json(ngos);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const User = require("../models/User");
    const Opportunity = require("../models/Opportunity");

    const ngoUser = await User.findById(req.params.id).select(
      "firstName description city ngoVerified createdAt role logo"
    );

    if (!ngoUser || ngoUser.role !== "ngo") {
      return res.status(404).json({ message: "NGO not found" });
    }

    const opportunities = await Opportunity.find({
      ngo: ngoUser._id,
      isActive: true,
    }).sort({ createdAt: -1 });

    const Application = require("../models/Application");

const opportunityIds = opportunities.map(opp => opp._id);

const totalApplications = await Application.countDocuments({
  opportunity: { $in: opportunityIds }
});

    res.json({
      ngo: ngoUser,
      opportunities,
      totalOpportunities: opportunities.length,
      totalApplications,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post(
  "/upload-logo",
  authMiddleware,
  allowRoles("ngo"),
  upload.single("logo"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const base64 = req.file.buffer.toString("base64");
      const dataURI = `data:${req.file.mimetype};base64,${base64}`;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: "ngo_logos",
      });

      const User = require("../models/User");

      await User.findByIdAndUpdate(req.user.userId, {
        logo: result.secure_url,
      });

      res.json({ logo: result.secure_url });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Upload failed" });
    }
  }
);

router.put(
  "/update",
  authMiddleware,
  allowRoles("ngo"),
  async (req, res) => {
    try {
      const User = require("../models/User");

      const {
        firstName,
        description,
        city,
        category,
        website,
      } = req.body;

      const updatedUser = await User.findByIdAndUpdate(
        req.user.userId,
        {
          firstName,
          description,
          city,
          category,
          website,
        },
        { new: true }
      ).select(
        "firstName description city category ngoVerified logo website"
      );

      res.json({
        message: "Profile updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("NGO UPDATE ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;

