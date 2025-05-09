import mongoose from 'mongoose';

// Informations système actuelles
const CURRENT_TIMESTAMP = "2025-05-07 12:35:03";
const CURRENT_USER = "Sdiabate1337";

// Ensure using container name for MongoDB in Docker
const MONGODB_URI = process.env.NODE_ENV === 'development' && process.env.CODESPACES === 'true' 
  ? 'mongodb://mongodb:27017/mythayun'
  : process.env.MONGODB_URI || 'mongodb://localhost:27017/mythayun';

let cachedConnection: typeof mongoose | null = null;

export async function connectToDatabase() {
  if (cachedConnection) {
    console.log('Using cached MongoDB connection');
    return cachedConnection;
  }

  try {
    const connection = await mongoose.connect(MONGODB_URI);
    console.log('Successfully connected to MongoDB');
    
    cachedConnection = connection;
    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export default connectToDatabase;