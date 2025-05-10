import mongoose, { Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Current system information
const CURRENT_TIMESTAMP = "2025-05-10 02:21:09";
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
  // Removed isLocked as it becomes a virtual property
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
}

// Static methods available on the user model
export interface UserModel extends Model<IUser, {}, IUserMethods> {
  findByEmail(email: string): Promise<Document<unknown, {}, IUser> & IUser & IUserMethods>;
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
      required: [true, 'Please provide a password'],
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
  // Only hash the password if it's modified or new
  if (!this.isModified('password')) return next();
  
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

// Static method to find user by email
UserSchema.static('findByEmail', function findByEmail(email: string) {
  return this.findOne({ email });
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