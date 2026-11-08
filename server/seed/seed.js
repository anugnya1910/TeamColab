// Usage: npm run seed   (wipes and repopulates the database with demo data)
require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/db');
const { seedDatabase } = require('./seedData');

(async () => {
  try {
    await connectDB();
    await seedDatabase();
    console.log('✅ Seeding complete. Login with demo@teamsync.com / demo123');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
})();
