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

module.exports = router;
