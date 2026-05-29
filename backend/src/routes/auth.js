const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const requireAuth = require("../middleware/auth");
const { jwtSecret, jwtExpiresIn } = require("../config");

const router = express.Router();

const signToken = (user) =>
  jwt.sign({ sub: user._id.toString(), email: user.email }, jwtSecret, {
    expiresIn: jwtExpiresIn,
  });

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });

    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });

    const token = signToken(user);

    return res.status(201).json({
      token,
      user: { id: user._id.toString(), name: user.name, email: user.email },
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to create account" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken(user);

    return res.json({
      token,
      user: { id: user._id.toString(), name: user.name, email: user.email },
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to log in" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.sub).select("name email");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch user" });
  }
});

module.exports = router;
