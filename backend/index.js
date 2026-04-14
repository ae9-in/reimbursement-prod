console.log('App starting...');

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');
const path = require('path');

dotenv.config();

// Fix for querySrv ECONNREFUSED _mongodb._tcp...
// This forces Node.js to use Google DNS instead of potentially broken local DNS
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
  console.log('DNS servers set to Google (8.8.8.8, 8.8.4.4)');
} catch (e) {
  console.warn('Failed to set DNS servers:', e.message);
}

const app = require('./app');
const { User, Profile, Policy, Claim, Comment } = require('./models');

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;

console.log('Environment variables loaded. Port:', PORT);

async function startServer() {
  console.log('Starting server...');
  
  let connectionString = MONGODB_URI;

  if (!connectionString) {
    console.warn('MONGODB_URI is not defined. Falling back to In-Memory DB.');
  }

  try {
    if (!connectionString || process.env.USE_MEMORY_DB === 'true') {
      console.log('Starting In-Memory MongoDB Server...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      connectionString = mongod.getUri();
      console.log('In-Memory MongoDB Server started at:', connectionString);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 5000,
      family: 4 // Force IPv4 to avoid some Render/Atlas DNS issues
    });
    console.log('Connected to MongoDB');

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
    if (!process.env.USE_MEMORY_DB && connectionString !== MONGODB_URI) {
       // If it was already a fallback and failed, exit
       process.exit(1);
    }
    // Try to fallback if not already trying memory db
    console.log('Attempting to fallback to In-Memory DB due to connection error...');
    process.env.USE_MEMORY_DB = 'true';
    return startServer();
  }
}

async function seedData() {
  const employeeEmail = (process.env.SEED_EMPLOYEE_EMAIL || "employee@example.com").toLowerCase();
  const managerEmail = (process.env.SEED_MANAGER_EMAIL || "manager@example.com").toLowerCase();
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@example.com").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || "password123";

  console.log('Seeding data with:');
  console.log(' - Admin:', adminEmail);
  console.log(' - Password:', password);

  // Create Users
  const employee = await User.create({ email: employeeEmail, password, role: 'employee' });
  const manager = await User.create({ email: managerEmail, password, role: 'manager' });
  const admin = await User.create({ email: adminEmail, password, role: 'admin' });

  console.log('Users created successfully');

  // Create Profiles
  await Profile.create({ user_id: employee._id, full_name: "Employee User", email: employeeEmail, department: "General", manager_id: manager._id });
  await Profile.create({ user_id: manager._id, full_name: "Manager User", email: managerEmail, department: "General", manager_id: admin._id });
  await Profile.create({ user_id: admin._id, full_name: "Admin User", email: adminEmail, department: "IT", manager_id: null });

  console.log('Profiles created successfully');

  // Create Initial Policy
  await Policy.create({ rate_per_km: 10.0, max_distance_per_claim: 1000, max_monthly_limit: 10000 });

  // Create Sample Claims
  const claim1 = await Claim.create({
    employee_id: employee._id,
    date_of_travel: new Date().toISOString().split('T')[0],
    distance_km: 120,
    purpose: "Client meeting in downtown",
    odometer_start: 15400,
    odometer_end: 15520,
    status: 'submitted',
    amount_calculated: 1200,
    receipt_url: "https://placehold.co/600x400/png?text=Sample+Receipt+1"
  });

  const claim2 = await Claim.create({
    employee_id: employee._id,
    date_of_travel: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    distance_km: 85,
    purpose: "Site visit for project Alpha",
    odometer_start: 15520,
    odometer_end: 15605,
    status: 'manager_approved',
    amount_calculated: 850,
    receipt_url: "https://placehold.co/600x400/png?text=Sample+Receipt+2"
  });

  const claim3 = await Claim.create({
    employee_id: manager._id,
    date_of_travel: new Date(Date.now() - 172800000).toISOString().split('T')[0],
    distance_km: 210,
    purpose: "Inter-office coordination",
    odometer_start: 42000,
    odometer_end: 42210,
    status: 'paid',
    amount_calculated: 2100
  });

  console.log('Sample claims created successfully');

  // Create Sample Comments
  await Comment.create({
    claim_id: claim1._id,
    author_id: employee._id,
    comment: "This was a standard business trip."
  });

  await Comment.create({
    claim_id: claim2._id,
    author_id: manager._id,
    comment: "Looks good, approved."
  });

  console.log('Sample comments created successfully');
}

startServer().catch(err => {
  console.error('Global error during startServer:', err);
  process.exit(1);
});
