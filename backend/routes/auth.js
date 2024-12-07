const express = require("express");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const router = express.Router();

// Generate a unique user ID (for simplicity, using a timestamp)
const generateUserId = () => {
  return `user_${Date.now()}`;
};

// Register a new user
router.post("/register", async (req, res) => {
  const {
    username,
    password,
    name,
    mobile,
    accountNumber,
    bankName,
    ifscCode,
  } = req.body;
  const email = username; // Use the username as email since we're using email for username
  const userId = generateUserId(); // Generate user ID

  try {
    const user = new User({
      username,
      password,
      name,
      mobile,
      email,
      accountNumber,
      bankName,
      ifscCode,
      userId,
      balance: 0, // Initialize balance to 0
    });
    await user.save();
    res.status(201).json({
      message: "User registered successfully",
      userId: userId,
      balance: 0,
      name: user.name,
      accountNumber: user.accountNumber,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Login a user
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  console.log("Login attempt:", { username });

  try {
    console.log("Finding user...");
    const user = await User.findOne({
      $or: [{ username: username }, { email: username }],
    });
    if (!user) {
      console.log("User not found");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValidPassword = await user.comparePassword(password);
    console.log("Password validation:", isValidPassword);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(200).json({
      token,
      userId: user.userId,
      name: user.name,
      accountNumber: user.accountNumber,
      balance: user.balance,
    }); // Return user details along with token and balance
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
