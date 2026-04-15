/**
 * reset-passwords.js
 * Run once to reset all user passwords to "password123"
 * Usage: node reset-passwords.js
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const dns = require('dns');

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4']);

const MONGODB_URI = process.env.MONGODB_URI;
const NEW_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'password123';

const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: String,
});
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000, family: 4 });
  console.log('Connected.');

  const users = await User.find({});
  console.log(`Found ${users.length} users.`);

  const hashed = await bcrypt.hash(NEW_PASSWORD, 10);

  for (const u of users) {
    await User.updateOne({ _id: u._id }, { $set: { password: hashed } });
    console.log(`  ✓ Reset password for: ${u.email} (${u.role})`);
  }

  console.log('\nAll passwords reset to:', NEW_PASSWORD);
  console.log('You can now log in with any of the accounts above.');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
