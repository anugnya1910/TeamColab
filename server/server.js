require('dotenv').config();
const { connectDB } = require('./config/db');

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'teamsync_dev_fallback_secret';
  console.warn('⚠️  JWT_SECRET not set in .env — using a development fallback.');
}

const app = require('./app');
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    const { useMemory } = await connectDB();

    // Auto-seed demo data on first run (or always in in-memory demo mode)
    const User = require('./models/User');
    const empty = (await User.estimatedDocumentCount()) === 0;
    if (useMemory || (empty && process.env.AUTO_SEED !== 'false')) {
      const { seedDatabase } = require('./seed/seedData');
      await seedDatabase();
    }

    app.listen(PORT, () => {
      console.log(`🚀 TeamSync API running on http://localhost:${PORT}`);
      console.log('   Demo login → demo@teamsync.com / demo123');
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    console.error('   → Is MongoDB running? Check MONGO_URI in server/.env');
    console.error('   → No MongoDB installed? Run "npm run demo" to use an in-memory database.');
    process.exit(1);
  }
})();
