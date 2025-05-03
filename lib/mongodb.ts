import mongoose from 'mongoose';

// MongoDB connection string
const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/mythayun';

// Global variable to maintain a cached connection across hot reloads in development
declare global {
  var mongoose: {
    conn: null | typeof mongoose;
    promise: null | Promise<typeof mongoose>;
  };
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connect to MongoDB
 * @returns Mongoose connection
 */
export async function connectToDatabase() {
  // If we already have a connection, return it
  if (cached.conn) {
    return cached.conn;
  }

  // If we're already connecting, wait for the promise to resolve
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then(mongoose => {
        console.log(`MongoDB connected successfully at ${new Date('2025-05-02T14:26:17').toISOString()}`);
        return mongoose;
      })
      .catch(error => {
        console.error('MongoDB connection error:', error);
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
}

/**
 * Disconnect from MongoDB (useful for testing)
 */
export async function disconnectFromDatabase() {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
}