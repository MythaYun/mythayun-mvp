import mongoose from 'mongoose';

let cachedConnection: typeof mongoose | null = null;

export async function connectToDatabase() {
  // Add detailed logging
  console.log(`[${new Date().toISOString()}] Connecting to MongoDB...`);
  console.log(`[${new Date().toISOString()}] Environment: NODE_ENV=${process.env.NODE_ENV}, VERCEL=${!!process.env.VERCEL}`);
  
  if (cachedConnection) {
    console.log(`[${new Date().toISOString()}] Using cached MongoDB connection`);
    return cachedConnection;
  }

  // Get MongoDB URI with better fallback logic
  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    console.error(`[${new Date().toISOString()}] MONGODB_URI environment variable is not set!`);
    throw new Error('Please define the MONGODB_URI environment variable');
  }
  
  // Log partial URI for debugging (hide credentials)
  const sanitizedUri = MONGODB_URI.replace(/:([^:@]+)@/, ':****@');
  console.log(`[${new Date().toISOString()}] Connecting to MongoDB with URI: ${sanitizedUri}`);

  try {
    const connection = await mongoose.connect(MONGODB_URI);
    console.log(`[${new Date().toISOString()}] Successfully connected to MongoDB`);
    
    cachedConnection = connection;
    return connection;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] MongoDB connection error:`, error);
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error(`[${new Date().toISOString()}] Error name: ${error.name}, message: ${error.message}`);
      console.error(`[${new Date().toISOString()}] Stack trace: ${error.stack}`);
    }
    
    throw error;
  }
}

export default connectToDatabase;