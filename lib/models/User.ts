import mongoose, { Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// User interface definition
export interface IUser {
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
  createdAt: Date;
  updatedAt: Date;
  isLocked?: boolean;
}

// Methods available on User documents
export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateVerificationToken(): string;
  generatePasswordResetToken(): string;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

// Static methods available on User model
export interface UserModel extends Model<IUser, {}, IUserMethods> {
  findByEmail(email: string): Promise<Document<unknown, {}, IUser> & IUser & IUserMethods>;
}

// Define the schema
const UserSchema = new mongoose.Schema<IUser, UserModel, IUserMethods>(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [50, 'Name cannot be more than 50 characters'],
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
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't return password by default
    },
    avatar: {
      type: String,
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot be more than 500 characters'],
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
    isLocked: { type: Boolean, default: false },
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
    timestamps: true, // Automatically add createdAt and updatedAt
  }
);

// Virtual property to check if account is locked
UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified or is new
  if (!this.isModified('password')) return next();
  
  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(12);
    // Hash the password along with the salt
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err: any) {
    return next(err);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string) {
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
    // Otherwise increment login attempts
    const updates = { $inc: { loginAttempts: 1 } } as any;
    
    // Lock the account if we've reached max attempts (5)
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
      updates.$set = { lockUntil: new Date(Date.now() + 60 * 60 * 1000) }; // 1 hour lock
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

// Static method to find user by email
UserSchema.static('findByEmail', function findByEmail(email: string) {
  return this.findOne({ email });
});

// Create the model
const User = mongoose.models.User || mongoose.model<IUser, UserModel>('User', UserSchema);

export default User;