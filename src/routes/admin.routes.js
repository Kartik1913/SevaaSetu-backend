const express = require("express");
const NGO = require("../models/NGO");
const authMiddleware = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const router = express.Router();

/**
 * VERIFY NGO (ADMIN ONLY)
 */
router.put(
  "/verify/:ngoId",
  authMiddleware,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const ngo = await NGO.findById(req.params.ngoId);

      if (!ngo) {
        return res.status(404).json({ message: "NGO not found" });
      }

      ngo.verified = true;
      await ngo.save();

      res.json({ message: "NGO verified successfully", ngo });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * LIST ALL NGOs (ADMIN ONLY)
 */
router.get(
  "/ngos",
  authMiddleware,
  allowRoles("admin"),
  async (req, res) => {
    const ngos = await NGO.find();
    res.json(ngos);
  }
);

module.exports = router;