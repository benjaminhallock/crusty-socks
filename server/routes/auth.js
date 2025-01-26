const router = require("express").Router();
const bcrypt = require("bcryptjs");
const User = require("../models/user");

const validateInput = (username, password) => {
  if (username.length < 3 || username.length > 20) {
    throw new Error("Username must be between 3 and 20 characters");
  }
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }
};

router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    validateInput(username, password);

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();

    req.session.userId = user._id;
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    validateInput(username, password);

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    req.session.userId = user._id;
    res.json({ message: "Logged in successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
