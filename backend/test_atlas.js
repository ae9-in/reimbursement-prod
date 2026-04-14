const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

console.log('--- MongoDB Connection Test ---');
console.log('URI:', MONGODB_URI ? MONGODB_URI.replace(/:([^@]+)@/, ':****@') : 'MISSING');

async function testConnection() {
  try {
    console.log('Attempting to connect to Atlas...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ SUCCESS: Connected to MongoDB Atlas!');
    
    // Check if database has any data
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections found:', collections.map(c => c.name).join(', ') || 'NONE');
    
    await mongoose.disconnect();
    console.log('Disconnected.');
  } catch (error) {
    console.error('❌ FAILURE: Connection failed.');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    if (error.reason) {
      console.error('Reason:', JSON.stringify(error.reason, null, 2));
    }
    process.exit(1);
  }
}

testConnection();
