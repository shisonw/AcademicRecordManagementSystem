const { MongoClient, ObjectId } = require('mongodb');

process.env.MONGODB_URI = 'mongodb+srv://Shison:Shison0420@clusterp.btdnqrz.mongodb.net/';

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
