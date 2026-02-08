const express = require("express");
const {
  register,
  login,
  getMe
} = require("../controllers/auth.controller");

const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");

router.get("/me", authMiddleware, getMe);

router.post("/register", register);
router.post("/login", login);

module.exports = router;



// const express = require("express");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const User = require("../models/User");

// const router = express.Router();

// /**
//  * REGISTER
//  */
// router.post("/register", async (req, res) => {
//   try {
//     const { name, email, password, role } = req.body;

//     if (!name || !email || !password) {
//       return res.status(400).json({ message: "All fields required" });
//     }

//     const existingUser = await User.findOne({$or: [{ email }, { name }]});

//     const emailExists = await User.findOne({ email });
//     if (emailExists) {
//       return res.status(400).json({
//       message: "Email already registered"
//     });
// }

// const usernameExists = await User.findOne({ name });
// if (usernameExists) {
//   return res.status(400).json({
//     message: "Username already taken"
//   });
// }


//     const hashedPassword = await bcrypt.hash(password, 10);

//     const user = await User.create({
//       name,
//       email,
//       password: hashedPassword,
//       role,
//     });

//     res.status(201).json({
//       message: "User registered",
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//       },
//     }); 
//   } catch (error) {
//     res.status(500).json({ message: "Server error" });
//   }
// });

// /**
//  * LOGIN
//  */
// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     const token = jwt.sign(
//       { id: user._id, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     res.json({
//       message: "Login successful",
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Server error" });
//   }
// });

// const authMiddleware = require("../middleware/auth");

// router.get("/me", authMiddleware, (req, res) => {
//   res.json({
//     message: "Protected route",
//     user: req.user,
//   });
// });


// module.exports = router;
