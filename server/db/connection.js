import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'config.env') });

const uri = process.env.ATLAS_URI;
if (!uri) {
  throw new Error('ATLAS_URI environment variable is not set');
}

mongoose.connect(uri, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  autoIndex: process.env.NODE_ENV !== 'production',
  maxPoolSize: 10
}).then(() => {
  console.info('MongoDB connected');
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

const db = mongoose.connection;

db.on('disconnected', () => {
  console.warn('MongoDB disconnected, attempting to reconnect...');
});

db.on('reconnected', () => {
  console.info('MongoDB reconnected');
});

db.on('error', err => {
  console.error('MongoDB error:', err);
});

export default db;
