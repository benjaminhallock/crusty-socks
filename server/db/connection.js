import { MongoClient, ServerApiVersion } from "mongodb";
import dotenv from 'dotenv';
import path from 'path';

// Update config path to look for config.env in project root
dotenv.config({ path: path.resolve(process.cwd(), 'config.env') });

const uri = process.env.ATLAS_URI;
if (!uri) {
    throw new Error('ATLAS_URI environment variable is not set. Please check your config.env file.');
}

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

let db;

try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    db = client.db("employees");
} catch (err) { 
    console.error("Error connecting to MongoDB:", err);
    // Add more descriptive error message
    console.error("Please check your MongoDB connection string and ensure the database is accessible.");
    process.exit(1);
}

export default db;
