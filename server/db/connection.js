import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'config.env') });

const uri = process.env.ATLAS_URI;
if (!uri) {
    throw new Error('ATLAS_URI environment variable is not set. Please check your config.env file.');
}

mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
.then(() => {
    console.log('Successfully connected to MongoDB.');
})
.catch((err) => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
});

const db = mongoose.connection;

db.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

export default db;
