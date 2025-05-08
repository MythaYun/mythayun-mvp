import mongoose from 'mongoose';

// Informations système actuelles
const CURRENT_TIMESTAMP = "2025-05-07 12:35:03";
const CURRENT_USER = "Sdiabate1337";

// URI de connexion à MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mythayun';

// Vérifier si nous avons déjà une connexion à MongoDB
let cachedConnection: typeof mongoose | null = null;

/**
 * Se connecter à la base de données MongoDB
 */
export async function connectToDatabase() {
  if (cachedConnection) {
    return cachedConnection;
  }

  // Options de connexion
  const options = {
    // Options de connexion MongoDB
  };

  try {
    const connection = await mongoose.connect(MONGODB_URI);
    console.log('Connecté à MongoDB');
    
    // Mettre en cache la connexion
    cachedConnection = connection;
    return connection;
  } catch (error) {
    console.error('Erreur de connexion à MongoDB:', error);
    throw error;
  }
}

export default connectToDatabase;