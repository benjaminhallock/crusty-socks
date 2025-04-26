import express from "express";
import { chatController } from "../controllers/chatController.js";
import { auth } from "../middleware/auth.js";
import { isAdmin } from "../middleware/auth.js";

const router = express.Router();
// Get all chats
router.get("/all", auth, isAdmin, chatController.getAllChats);
// Get a single chat by ID
router.get("/:id", auth, chatController.getChatById);
// Get chat history for a specific user (admin only)
router.get(
  "/history/:userId",
  auth,
  isAdmin,
  chatController.getChatHistoryByUserId
);

export default router;
