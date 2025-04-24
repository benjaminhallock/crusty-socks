import mongoose from 'mongoose';

import User from './user.js';

const chatSchema = new mongoose.Schema({
  lobbyObjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lobby',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  username: String,
  message: String,
  timestamp: Date,
  isSystemMessage: Boolean,
  isDeleted: Boolean,
  visibleTo: String,
});

chatSchema.pre('save', function (next) {
  if (this.isNew) {
    // If we have both userId and username, validate they match
    if (this.userId && this.username) {
      User.findOne({
        $and: [{ _id: this.userId }, { username: this.username }],
      })
        .then((user) => {
          if (!user) {
            return next(new Error('UserId and username do not match'));
          }
          next();
        })
        .catch((err) => next(err));
    }
    // If we only have username, find userId
    else if (this.username) {
      User.findOne({ username: this.username })
        .then((user) => {
          if (user) {
            this.userId = user._id;
          }
          next();
        })
        .catch((err) => next(err));
    }
    // If we only have userId, find username
    else if (this.userId) {
      User.findById(this.userId)
        .then((user) => {
          if (user) {
            this.username = user.username;
          }
          next();
        })
        .catch((err) => next(err));
    } else {
      next();
    }
  } else {
    next(); // Call next() if userId is already set
  }
});

chatSchema.statics.findOneOrCreate = async function (lobbyObjectId) {
  const chat = await this.findOne({ lobbyObjectId });
  if (chat) {
    return chat;
  }
  return await this.create({ lobbyObjectId });
};

chatSchema.statics.findByLobbyId = async function (lobbyObjectId) {
  const chat = await this.find({ lobbyObjectId }).sort({ timestamp: -1 });
  if (!chat) {
    return null;
  }
  return chat;
};
chatSchema.statics.findByLobbyIdAndUserId = async function (
  lobbyObjectId,
  userId
) {
  const chat = await this.find({ lobbyObjectId, userId }).sort({
    timestamp: -1,
  });
  if (!chat) {
    return null;
  }
  return chat;
};

// Index for faster queries
chatSchema.index({ lobbyObjectId: 1, timestamp: 1 });
chatSchema.index({ lobbyObjectId: 1, timestamp: -1 });
chatSchema.index({ lobbyObjectId: 1, visibleTo: 1 });

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
