import mongoose from "mongoose";

const chatroomSchema = new mongoose.Schema(
  {
    roomLeader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    roomCode: {
      type: String,
      required: true,
      unique: true,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      default: "random",
    },
    wordCount: {
      type: Number,
      default: 3,
      min: 1,
      max: 5,
    },
    drawTime: {
      type: Number,
      default: 60,
      min: 30,
      max: 180,
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Chatroom = mongoose.model("Chatroom", chatroomSchema);
export default Chatroom;
