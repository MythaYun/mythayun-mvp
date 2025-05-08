import mongoose, { Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Informations système actuelles
const CURRENT_TIMESTAMP = "2025-05-07 15:31:08";
const CURRENT_USER = "Sdiabate1337";

// Interface utilisateur
export interface IUser {
  _id?: mongoose.Types.ObjectId | string;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  bio?: string;
  favoriteTeams: string[];
  role: 'user' | 'admin';
  isVerified: boolean;
  verificationToken?: string;
  verificationExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  lastLogin?: Date;
  isActive: boolean;
  // Supprimé isLocked car il devient une propriété virtuelle
  createdAt: Date;
  updatedAt: Date;
}

// Méthodes disponibles sur les documents utilisateur
export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateVerificationToken(): string;
  generatePasswordResetToken(): string;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
  isAccountLocked(): boolean; // Méthode pour vérifier si le compte est verrouillé
}

// Méthodes statiques disponibles sur le modèle utilisateur
export interface UserModel extends Model<IUser, {}, IUserMethods> {
  findByEmail(email: string): Promise<Document<unknown, {}, IUser> & IUser & IUserMethods>;
}

// Définition du schéma
const UserSchema = new mongoose.Schema<IUser, UserModel, IUserMethods>(
  {
    name: {
      type: String,
      required: [true, 'Veuillez fournir votre nom'],
      trim: true,
      minlength: [3, 'Le nom doit avoir au moins 3 caractères'],
      maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères'],
    },
    email: {
      type: String,
      required: [true, 'Veuillez fournir une adresse email'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Veuillez fournir une adresse email valide'],
    },
    password: {
      type: String,
      required: [true, 'Veuillez fournir un mot de passe'],
      minlength: [8, 'Le mot de passe doit avoir au moins 8 caractères'],
      select: false, // Ne pas retourner le mot de passe par défaut
    },
    avatar: {
      type: String,
    },
    bio: {
      type: String,
      maxlength: [500, 'La bio ne peut pas dépasser 500 caractères'],
    },
    favoriteTeams: {
      type: [String],
      default: [],
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    // Supprimé le champ isLocked du schéma, nous utiliserons uniquement la propriété virtuelle
    verificationToken: String,
    verificationExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
    lastLogin: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Ajoute automatiquement createdAt et updatedAt
  }
);

// Propriété virtuelle pour vérifier si le compte est verrouillé
UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

// Méthode pour vérifier si le compte est verrouillé
UserSchema.methods.isAccountLocked = function() {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

// Hash le mot de passe avant la sauvegarde
UserSchema.pre('save', async function(next) {
  // Hash le mot de passe uniquement s'il a été modifié ou est nouveau
  if (!this.isModified('password')) return next();
  
  try {
    // Générer un sel
    const salt = await bcrypt.genSalt(12);
    // Hash le mot de passe avec le sel
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err: any) {
    return next(err);
  }
});

// Méthode pour comparer les mots de passe
UserSchema.methods.comparePassword = async function(candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Générer un token de vérification d'email
UserSchema.methods.generateVerificationToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.verificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Token expire dans 24 heures
  this.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  return token;
};

// Générer un token de réinitialisation de mot de passe
UserSchema.methods.generatePasswordResetToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Token expire dans 1 heure
  this.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
  
  return token;
};

// Incrémenter les tentatives de connexion
UserSchema.methods.incrementLoginAttempts = async function() {
  // Si le verrouillage précédent a expiré, redémarrer à 1
  if (this.lockUntil && this.lockUntil < new Date()) {
    await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  } else {
    // Sinon, incrémenter les tentatives de connexion
    const updates = { $inc: { loginAttempts: 1 } } as any;
    
    // Verrouiller le compte si on a atteint le max de tentatives (5)
    if (this.loginAttempts + 1 >= 5 && !this.isAccountLocked()) {
      updates.$set = { lockUntil: new Date(Date.now() + 60 * 60 * 1000) }; // 1 heure
    }
    
    await this.updateOne(updates);
  }
};

// Réinitialiser les tentatives de connexion
UserSchema.methods.resetLoginAttempts = async function() {
  await this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

// Méthode statique pour trouver un utilisateur par email
UserSchema.static('findByEmail', function findByEmail(email: string) {
  return this.findOne({ email });
});

// Créer le modèle
const User = mongoose.models.User || mongoose.model<IUser, UserModel>('User', UserSchema);

export default User;