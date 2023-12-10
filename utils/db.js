const { MongoClient, ObjectId } = require('mongodb');

process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017';

if (!process.env.MONGODB_URI) {
    // throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
    process.env.MONGODB_URI = 'mongodb://localhost:27017';
}

// Connect to MongoDB
async function connectToDB() {
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db('academics_record');
    db.client = client;
    return db;
}

module.exports = { connectToDB, ObjectId };