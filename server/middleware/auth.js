import jwt from "jsonwebtoken";

import User from "../models/user.js";

export const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token?.trim()) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded?.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;
    req.token = `Bearer ${token}`;
    req._id = user._id;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

export const isAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token?.trim()) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded?.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }
    if (!user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }
    req.user = user;
    req.token = `Bearer ${token}`;
    req._id = user._id;
  } catch (err) {
    res.status(401).json({
      success: false,
      message: "Token is not valid",
    });
  }
};
