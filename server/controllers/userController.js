import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import User from "../models/user.js";

dotenv.config("/config.env");

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "24h" });

const cleanUser = (user) => ({
  _id: user._id,
  email: user.email,
  username: user.username,
});

export const userController = {
  getUser: async (req, res) => {
    try {
      res.status(200).json({
        message: "User deleted",
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        message: "Failed to delete user",
      });
    }
  },

  validateToken: async (req, res) => {
    try {
      res.status(200).json({
        user: cleanUser(req.user),
        token: req.token,
      });
    } catch (error) {
      res.status(401).json({
        ok: false,
        message: "Invalid token",
      });
    }
  },

  register: async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        ok: false,
        message: "Missing required fields",
      });
    }

    if (!/^[a-zA-Z0-9]{6,}$/.test(username)) {
      return res.status(400).json({
        ok: false,
        message:
          "Username must be at least 6 characters and contain only letters and numbers",
      });
    }

    if (!/^[a-zA-Z0-9]{6,}$/.test(password)) {
      return res.status(400).json({
        ok: false,
        message:
          "Password must be at least 6 characters and contain only letters and numbers",
      });
    }

    try {
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });

      if (existingUser) {
        return res.status(400).json({
          ok: false,
          message:
            existingUser.email === email
              ? "Email already exists"
              : "Username already exists",
        });
      }

      const user = await User.create({ username, email, password });
      const token = generateToken(user._id);

      res.status(201).json({
        user: cleanUser(user),
        token,
      });
    } catch (error) {
      res.status(400).json({
        ok: false,
        message: "Registration failed",
      });
    }
  },

  login: async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        message: "Email and password required",
      });
    }

    try {
      const user = await User.findByCredentials(email, password);

      if (!user) {
        return res.status(401).json({
          ok: false,
          message: "Invalid credentials",
        });
      }

      const token = generateToken(user._id);

      res.status(200).json({
        user: cleanUser(user),
        token,
        message: "Login successful",
      });
    } catch (error) {
      res.status(401).json({
        ok: false,
        message: "Invalid credentials",
      });
    }
  },

  getAllUsers: async (req, res) => {
    try {
      const users = await User.find({}, "-password");
      res.status(200).json({ users });
    } catch (error) {
      res.status(500).json({
        ok: false,
        message: "Failed to get users",
      });
    }
  },
};
