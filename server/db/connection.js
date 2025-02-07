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
    // Allowing console for important server status messages
    console.info('MongoDB connected');
  } catch (error) {
    // Allowing console for critical errors
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const db = mongoose.connection;

// Single handlers for connection events
db.on('disconnected', () => {
  // Allowing console for important connection status
  console.warn('MongoDB disconnected, attempting to reconnect...');
});

db.on('reconnected', () => {
  // Allowing console for important connection status
  console.info('MongoDB reconnected');
});

db.on('error', err => {
  // Allowing console for critical errors
  console.error('MongoDB error:', err);
});

export default connectDB;