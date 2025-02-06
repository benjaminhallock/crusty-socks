import express from "express";
import { userController } from "../controllers/userController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();
//route to validate token
router.get("/validate", auth, userController.validateToken);
// Register route
router.post("/register", userController.register);
// Login route
router.post("/login", userController.login);

export default router;
