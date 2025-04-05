import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: './config.env' });

const uri = process.env.ATLAS_URI;
if (!uri) {
  throw new Error('ATLAS_URI environment variable is not set');
}

export const connectDB = async () => {
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      autoIndex: process.env.NODE_ENV !== 'production',
      maxPoolSize: 10
    });
  } catch (error) {
    process.exit(1);
  }
};

const db = mongoose.connection;

// Single handlers for connection events
db.on('disconnected', () => {
});

db.on('reconnected', () => {
});

db.on('error', err => {
});

export default connectDB;