const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const router = express.Router();

// Only volunteers allowed
router.use(authMiddleware, allowRoles("volunteer"));

router.post("/apply", (req, res) => {
  res.json({ message: "Applied successfully" });
});

router.get("/applications", (req, res) => {
  res.json({ message: "Your applications" });
});

router.put("/update", async (req, res) => {
  try {
    const User = require("../models/User");

    const {
      firstName,
      lastName,
      city,
      availability,
      skills,
      interests,
      bio,
    } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      {
        firstName,
        lastName,
        city,
        availability,
        skills,
        interests,
        bio,
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("VOLUNTEER UPDATE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
