console.log('App starting...');

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');
const path = require('path');

dotenv.config();

const app = require('./app');
const { User, Profile, Policy, Claim, Comment } = require('./models');

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;

console.log('Environment variables loaded. Port:', PORT);

async function startServer() {
  console.log('Starting server...');
  
  if (!MONGODB_URI) {
    console.error('CRITICAL ERROR: MONGODB_URI is not defined.');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      family: 4 // Force IPv4 to avoid some Render/Atlas DNS issues
    });
    console.log('Connected to MongoDB Atlas');

    const userCount = await User.countDocuments();
    console.log('Current user count:', userCount);
    
    if (userCount === 0) {
      console.log('Database is empty. Seeding initial data...');
      await seedData();
      console.log('Database seeded successfully');
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Server failed to start:', err);
    process.exit(1);
  }
}

async function seedData() {
  const employeeEmail = "employee@example.com";
  const managerEmail = "manager@example.com";
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
  const password = process.env.SEED_ADMIN_PASSWORD || "password123";

  // Create Users
  const employee = await User.create({ email: employeeEmail, password, role: 'employee' });
  const manager = await User.create({ email: managerEmail, password, role: 'manager' });
  const admin = await User.create({ email: adminEmail, password, role: 'admin' });

  // Create Profiles
  await Profile.create({ user_id: employee._id, full_name: "John Employee", email: employeeEmail, department: "Sales", manager_id: manager._id });
  await Profile.create({ user_id: manager._id, full_name: "Jane Manager", email: managerEmail, department: "Sales", manager_id: admin._id });
  await Profile.create({ user_id: admin._id, full_name: "Admin User", email: adminEmail, department: "IT", manager_id: null });

  // Create Initial Policy
  await Policy.create({ rate_per_km: 8.0, max_distance_per_claim: 500, max_monthly_limit: 5000 });
}

startServer().catch(err => {
  console.error('Global error during startServer:', err);
  process.exit(1);
});
