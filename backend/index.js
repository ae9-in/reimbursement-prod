const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');
const path = require('path');
const { Profile, Policy, Claim, Comment } = require('./models');

// Force Google DNS for Atlas SRV resolution
dns.setServers(['8.8.8.8']);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = require('./app');
const User = require('./models/User');

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;

async function startServer() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in .env');
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    // Check if seeding is needed (e.g., if no users exist)
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Database is empty. Seeding initial data...');
      await seedData();
      console.log('Database seeded successfully');
    }

    app.listen(PORT, () => {
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

startServer();
