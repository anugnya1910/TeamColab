const mongoose = require('mongoose');

let memoryServer = null;

/**
 * Connects to MongoDB.
 * - Normal mode: uses MONGO_URI from .env
 * - Demo mode (`npm run demo` or USE_MEMORY_DB=true): spins up an in-memory
 *   MongoDB so the app works even without MongoDB installed.
 */
async function connectDB() {
  const useMemory = process.env.USE_MEMORY_DB === 'true' || process.argv.includes('--memory');
  let uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/teamsync';

  if (useMemory) {
    let MongoMemoryServer;
    try {
      ({ MongoMemoryServer } = require('mongodb-memory-server-core'));
    } catch {
      throw new Error('mongodb-memory-server-core is not installed. Run "npm install" inside /server.');
    }
    console.log('🧪 Starting in-memory MongoDB (first run downloads the MongoDB binary, please wait)...');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri('teamsync');
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log(`✅ MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}${useMemory ? ' (in-memory)' : ''}`);
  return { useMemory };
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}

module.exports = { connectDB, disconnectDB };
