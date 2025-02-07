import User from "../models/user.js";

export const admin = async (req, res, next) => {
  try {
    // Get user from previous auth middleware
    const user = req.user;

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    console.log("Admin middleware user:", user);

    // Check if user is an admin
    if (!user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    // Continue to next middleware or route handler
    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error checking admin privileges",
    });
  }
};

export default admin;
