import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 6,
      maxlength: 20,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9]+$/,
        "Username can only contain letters and numbers",
      ],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
      minlength: 6,
      match: [
        /^[a-zA-Z0-9]+$/,
        "Password can only contain letters and numbers",
      ],
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    gameStats: {
      totalScore: {
        type: Number,
        default: 0,
      },
      gamesPlayed: {
        type: Number,
        default: 0,
      },
      gamesWon: {
        type: Number,
        default: 0,
      },
    },
    profile: {
      displayName: String,
      bio: String,
      avatarUrl: String,
      lastActive: {
        type: Date,
        default: Date.now,
      },
    },
    preferences: {
      profanityFilter: {
        type: Boolean,
        default: true,
      },
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      showOnlineStatus: {
        type: Boolean,
        default: true,
      },
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    pendingEmail: {
      type: String,
      default: null,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: true,
    },
    toJSON: {
      transform: (_, ret) => {
        delete ret.password;
        return ret;
      },
    },
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") && !this.isNew) return next();
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.statics.findByUsername = async function (username) {
  return this.findOne({ username }).catch((err) => {
    console.error("Error finding user by username:", err);
    return null;
  });
};

userSchema.statics.findByCredentials = async function (email, password) {
  // email can be username or email
  const user = await this.findOne({
    $or: [{ email: email }, { username: email }],
  }).select("+password");

  if (!user) {
    console.info("No user found");
    return null;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    console.warn("Password incorrect");
    return null;
  }
  return user;
};

const User = mongoose.model("User", userSchema);
export default User;
