import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authentication token missing",
      });
    }

    let token = authHeader;
    // Handle both formats but always store as clean token
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format",
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded?.userId) {
        throw new Error("Invalid token payload");
      }
      
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      // Add user info to request object
      req.user = user;
      req.token = `Bearer ${token}`; // Store consistent format
      req._id = decoded.userId;
      
      next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error during authentication",
    });
  }
};
