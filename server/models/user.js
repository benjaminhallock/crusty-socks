import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 6,
    maxlength: 20,
    lowercase: true,
    match: [/^[a-zA-Z0-9]+$/, 'Username can only contain letters and numbers']
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    select: false,
    minlength: 6,
    match: [/^[a-zA-Z0-9]+$/, 'Password can only contain letters and numbers']
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  gameStats: {
    totalScore: {
      type: Number,
      default: 0
    },
    currentRoundPoints: {
      type: Number,
      default: 0
    },
    gamesPlayed: {
      type: Number,
      default: 0
    },
    gamesWon: {
      type: Number,
      default: 0
    }
  },
  chatHistory: [{
    message: String,
    roomId: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  profile: {
    displayName: String,
    bio: String,
    avatarUrl: String,
    lastActive: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      delete ret.password;
      return ret;
    }
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.statics.findByUsername = async function(username) {
  return this.findOne({ username });
};

userSchema.statics.findByCredentials = async function(email, password) {
  const user = await this.findOne({ email }).select('+password');
  if (!user || !await bcrypt.compare(password, user.password)) {
    return null;
  }
  return user;
};

const User = mongoose.model('User', userSchema);
export default User;
