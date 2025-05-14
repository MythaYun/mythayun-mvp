import mongoose, { Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Current system information
const CURRENT_TIMESTAMP = "2025-05-13 22:17:09";
const CURRENT_USER = "Sdiabate1337";

// User interface
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
  // Social authentication fields
  googleId?: string;
  facebookId?: string;
  authProvider?: 'local' | 'google' | 'facebook';
  profilePicture?: string; // For social profile pictures
  createdAt: Date;
  updatedAt: Date;
}

// Methods available on user documents
export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateVerificationToken(): string;
  generatePasswordResetToken(): string;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
  isAccountLocked(): boolean; // Method to check if account is locked
  linkSocialAccount(provider: 'google' | 'facebook', socialId: string, profileData?: any): Promise<void>;
}

// Static methods available on the user model
export interface UserModel extends Model<IUser, {}, IUserMethods> {
  findByEmail(email: string): Promise<Document<unknown, {}, IUser> & IUser & IUserMethods>;
  findBySocialId(provider: string, id: string): Promise<Document<unknown, {}, IUser> & IUser & IUserMethods>;
  createSocialUser(userData: Partial<IUser>): Promise<Document<unknown, {}, IUser> & IUser & IUserMethods>;
}

// Schema definition
const UserSchema = new mongoose.Schema<IUser, UserModel, IUserMethods>(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: function() {
        // Password only required for local auth
        return !this.googleId && !this.facebookId;
      },
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't return password by default
    },
    avatar: {
      type: String,
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
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
    // Removed isLocked field from schema, we'll only use the virtual property
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
    // Social authentication fields
    googleId: {
      type: String,
      sparse: true, // Allows null values with unique index
      index: true,
    },
    facebookId: {
      type: String,
      sparse: true, // Allows null values with unique index
      index: true,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'facebook'],
      default: 'local',
    },
    profilePicture: {
      type: String, // URL to profile picture (especially from social providers)
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Virtual property to check if account is locked
UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

// Method to check if account is locked
UserSchema.methods.isAccountLocked = function() {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

// Hash password before saving
UserSchema.pre('save', async function(next) {
  // Only hash the password if it's modified or new and exists
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    // Generate salt
    const salt = await bcrypt.genSalt(12);
    // Hash password with salt
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err: any) {
    return next(err);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword: string) {
  // If no password (social auth user), always fail password comparison
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate email verification token
UserSchema.methods.generateVerificationToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.verificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Token expires in 24 hours
  this.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  console.log(`[${CURRENT_TIMESTAMP}] Generated verification token for: ${this.email}`);
  console.log(`[${CURRENT_TIMESTAMP}] Verification token expires: ${this.verificationExpires}`);
  
  return token;
};

// Generate password reset token
UserSchema.methods.generatePasswordResetToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Token expires in 1 hour
  this.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
  
  return token;
};

// Increment login attempts
UserSchema.methods.incrementLoginAttempts = async function() {
  // If previous lock has expired, restart at 1
  if (this.lockUntil && this.lockUntil < new Date()) {
    await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  } else {
    // Otherwise, increment login attempts
    const updates = { $inc: { loginAttempts: 1 } } as any;
    
    // Lock account if max attempts reached (5)
    if (this.loginAttempts + 1 >= 5 && !this.isAccountLocked()) {
      updates.$set = { lockUntil: new Date(Date.now() + 60 * 60 * 1000) }; // 1 hour
      console.log(`[${CURRENT_TIMESTAMP}] Account locked for: ${this.email} until ${new Date(Date.now() + 60 * 60 * 1000)}`);
    }
    
    await this.updateOne(updates);
  }
};

// Reset login attempts
UserSchema.methods.resetLoginAttempts = async function() {
  await this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

// Method to link a social account to existing user
UserSchema.methods.linkSocialAccount = async function(provider: 'google' | 'facebook', socialId: string, profileData?: any) {
  // Set the provider ID
  if (provider === 'google') {
    this.googleId = socialId;
  } else if (provider === 'facebook') {
    this.facebookId = socialId;
  }
  
  // Update auth provider if previously was local
  if (this.authProvider === 'local') {
    this.authProvider = provider;
  }
  
  // Set profile picture if provided and user doesn't have one
  if (profileData?.picture && !this.profilePicture && !this.avatar) {
    this.profilePicture = profileData.picture;
  }
  
  // Social accounts are considered verified
  if (!this.isVerified) {
    this.isVerified = true;
  }
  
  // Save the user
  await this.save();
  
  console.log(`[${CURRENT_TIMESTAMP}] Linked ${provider} account to user: ${this.email}`);
};

// Static method to find user by email
UserSchema.static('findByEmail', function findByEmail(email: string) {
  return this.findOne({ email });
});

// Static method to find user by social ID
UserSchema.static('findBySocialId', function findBySocialId(provider: string, id: string) {
  const query = provider === 'google' 
    ? { googleId: id } 
    : provider === 'facebook' 
      ? { facebookId: id } 
      : null;
  
  if (!query) throw new Error('Invalid social provider');
  return this.findOne(query);
});

// Static method to create a user from social login data
UserSchema.static('createSocialUser', async function createSocialUser(userData: Partial<IUser>) {
  // Ensure required fields
  if (!userData.email || !userData.name || (!userData.googleId && !userData.facebookId)) {
    throw new Error('Missing required fields for social user creation');
  }
  
  // Set defaults for social users
  const user = new this({
    ...userData,
    isVerified: true, // Social users are automatically verified
    authProvider: userData.googleId ? 'google' : 'facebook',
    password: crypto.randomBytes(16).toString('hex'), // Random password for security
  });
  
  await user.save();
  console.log(`[${CURRENT_TIMESTAMP}] Created new user via social auth: ${userData.email}`);
  return user;
});

// Make sure ObjectId is serialized to string when converting to JSON
UserSchema.set('toJSON', {
  transform: function (doc, ret) {
    if (ret._id) {
      ret._id = ret._id.toString();
    }
    delete ret.password;
    return ret;
  }
});

// Create the model
const User = mongoose.models.User || mongoose.model<IUser, UserModel>('User', UserSchema);

export default User;