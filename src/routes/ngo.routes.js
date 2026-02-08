const express = require("express");
const NGO = require("../models/NGO");
const authMiddleware = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const router = express.Router();

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
    const ngos = await NGO.find({ verified: true });
    res.json(ngos);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

