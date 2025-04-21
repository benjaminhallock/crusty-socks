import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  reportedUser: {
    type: String,
    required: true,
  },
  reportedBy: {
    type: String,
    required: true,
  },
  roomId: {
    type: String,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  additionalComments: {
    type: String,
    default: "",
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  chatLogs: {
    type: [
      {
        username: String,
        message: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    default: [],
  },
  status: {
    type: String,
    enum: ["pending", "reviewed", "resolved"],
    default: "pending",
  },
  canvasData: {
    type: String,
    default: null,
  },
});

const Report = mongoose.model("Report", reportSchema);

export default Report;
