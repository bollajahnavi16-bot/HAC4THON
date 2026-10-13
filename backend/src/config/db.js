import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { env } from './env.js';

let mongodInstance = null;

export const connectDB = async () => {
  // If already connected, reuse active connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  let uri = env.MONGODB_URI;

  try {
    if (uri && uri.trim() !== '') {
      console.log(`[Database] Attempting connection to MongoDB URI: ${uri.replace(/\/\/.*@/, '//<credentials>@')}`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 4000,
      });
      console.log('[Database] Connected successfully to provided MongoDB URI.');
      return mongoose.connection;
    }
  } catch (err) {
    console.warn(`[Database] Provided MongoDB connection failed (${err.message}). Falling back to Embedded In-Memory MongoDB.`);
  }

  // Fallback to In-Memory MongoDB Server for guaranteed zero-setup demonstration!
  try {
    if (!mongodInstance) {
      console.log('[Database] Initializing Embedded MongoMemoryServer for standalone hackathon execution...');
      mongodInstance = await MongoMemoryServer.create();
    }
    const memoryUri = mongodInstance.getUri();
    await mongoose.connect(memoryUri);
    console.log('[Database] Embedded MongoMemoryServer connected successfully! Data will persist during runtime.');
    return mongoose.connection;
  } catch (memErr) {
    console.error('[Database] Fatal: Failed to initialize in-memory database:', memErr);
    throw memErr;
  }
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongodInstance) {
    await mongodInstance.stop();
    mongodInstance = null;
  }
};
