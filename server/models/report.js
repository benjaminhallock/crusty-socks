import mongoose from 'mongoose';

import Chat from './chat.js'; // Assuming you have a Chat model
import User from './user.js'; // Assuming you have a User model

const reportSchema = new mongoose.Schema(
  {
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lobby',
      required: true,
    },
    reason: { type: String, required: true },
    additionalComments: { type: String },
    chatLogs: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chat' }],
      validate: [(array) => array.length > 0, 'Chat logs cannot be empty'],
    },
    drawingData: { type: String }, // Base64 encoded drawing data
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved'],
      default: 'pending',
    },
    resolvedAt: { type: Date },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolutionComments: { type: String },
  },
  { timestamps: true }
);

reportSchema.index({ reportedUser: 1, roomId: 1 }, { unique: true });
reportSchema.index({ reportedBy: 1, roomId: 1 }, { unique: true });

export default mongoose.model('Report', reportSchema);
