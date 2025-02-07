import User from "../models/user.js";

export const admin = async (req, res, next) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required"
    });
  }
//TODO: Add admin check

  next();
};

export default admin;
