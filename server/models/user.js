import mongoose from 'mongoose';
import bcrypt from 'bcryptjs'; 

const userSchema = new mongoose.Schema({
  // Basic user info
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
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
    minlength: 8
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Helper method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email });
};

// Helper method to find user by username
userSchema.statics.findByUsername = function(username) {
  return this.findOne({ username });
};

// Helper method to check password
userSchema.statics.findByCredentials = async function(email, password) {
  const user = await this.findOne({ email });
  if (!user) return null;
  
  const isMatch = await bcrypt.compare(password, user.password);
  return isMatch ? user : null;
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

const User = mongoose.model('User', userSchema);
export default User;
