import mongoose, { Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Current system information
const CURRENT_TIMESTAMP = "2025-07-04 15:00:25";
const CURRENT_USER = "Sdiabate1337";

// User interface
interface IUser {
  _id?: mongoose.Types.ObjectId | string;
  name: string;
  email: string;
  password?: string;
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
  profilePicture?: string;
  
  // New fields for onboarding
  isNewUser?: boolean;
  hasCompletedOnboarding?: boolean;
  preferences?: {
    favoriteLeagues?: string[];
    favoriteTeams?: string[];
    notificationPreferences?: {
      matchReminders?: boolean;
      scoreUpdates?: boolean;
      newsAlerts?: boolean;
    };
    displayPreferences?: {
      darkMode?: boolean;
      compactView?: boolean;
    };
    [key: string]: any;
  };
  
  createdAt: Date;
  updatedAt: Date;
  isFirstLogin?: boolean;
  previousLogin?: Date;
}

// Methods interface
interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateVerificationToken(): string;
  generatePasswordResetToken(): string;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
  isAccountLocked(): boolean;
  linkSocialAccount(provider: 'google' | 'facebook', socialId: string, profileData?: any): Promise<void>;
}

// Type pour le document complet
type UserDocument = Document<unknown, {}, IUser> & IUser & IUserMethods;

// Static methods interface
interface IUserModel extends Model<IUser, {}, IUserMethods> {
  findByEmail(email: string): Promise<UserDocument | null>;
  findBySocialId(provider: string, id: string): Promise<UserDocument | null>;
  createSocialUser(userData: Partial<IUser>): Promise<UserDocument>;
}

// Schema definition
const UserSchema = new mongoose.Schema<IUser, IUserModel, IUserMethods>(
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
      required: function(this: IUser) {
        return !this.googleId && !this.facebookId;
      },
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    avatar: String,
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
    googleId: {
      type: String,
      sparse: true,
      index: true,
    },
    facebookId: {
      type: String,
      sparse: true,
      index: true,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'facebook'],
      default: 'local',
    },
    profilePicture: String,
    isNewUser: {
      type: Boolean,
      default: true,
    },
    hasCompletedOnboarding: {
      type: Boolean,
      default: false,
    },
    preferences: {
      favoriteLeagues: {
        type: [String],
        default: [],
      },
      favoriteTeams: {
        type: [String],
        default: [],
      },
      notificationPreferences: {
        matchReminders: {
          type: Boolean,
          default: true,
        },
        scoreUpdates: {
          type: Boolean,
          default: true,
        },
        newsAlerts: {
          type: Boolean,
          default: false,
        },
      },
      displayPreferences: {
        darkMode: {
          type: Boolean,
          default: true,
        },
        compactView: {
          type: Boolean,
          default: false,
        },
      },
    },
    isFirstLogin: {
      type: Boolean,
      default: true,
    },
    previousLogin: Date,
  },
  {
    timestamps: true,
  }
);

// Virtual property
UserSchema.virtual('isLocked').get(function(this: UserDocument) {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

// Methods
UserSchema.methods.isAccountLocked = function(this: UserDocument) {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

UserSchema.pre('save', async function(this: UserDocument, next) {
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err: any) {
    return next(err);
  }
});

UserSchema.pre('save', function(this: UserDocument, next) {
  if (this.isNew) {
    this.isNewUser = true;
    console.log(`[${CURRENT_TIMESTAMP}] New user created: ${this.email}, isNewUser set to true`);
  }
  next();
});

UserSchema.methods.comparePassword = async function(this: UserDocument, candidatePassword: string) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.generateVerificationToken = function(this: UserDocument) {
  const token = crypto.randomBytes(32).toString('hex');
  this.verificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  this.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  console.log(`[${CURRENT_TIMESTAMP}] Generated verification token for: ${this.email}`);
  console.log(`[${CURRENT_TIMESTAMP}] Verification token expires: ${this.verificationExpires}`);
  
  return token;
};

UserSchema.methods.generatePasswordResetToken = function(this: UserDocument) {
  const token = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  this.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
  
  return token;
};

UserSchema.methods.incrementLoginAttempts = async function(this: UserDocument) {
  if (this.lockUntil && this.lockUntil < new Date()) {
    await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  } else {
    const updates = { $inc: { loginAttempts: 1 } } as any;
    
    if (this.loginAttempts + 1 >= 5 && !this.isAccountLocked()) {
      updates.$set = { lockUntil: new Date(Date.now() + 60 * 60 * 1000) };
      console.log(`[${CURRENT_TIMESTAMP}] Account locked for: ${this.email} until ${new Date(Date.now() + 60 * 60 * 1000)}`);
    }
    
    await this.updateOne(updates);
  }
};

UserSchema.methods.resetLoginAttempts = async function(this: UserDocument) {
  await this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

UserSchema.methods.linkSocialAccount = async function(this: UserDocument, provider: 'google' | 'facebook', socialId: string, profileData?: any) {
  if (provider === 'google') {
    this.googleId = socialId;
  } else if (provider === 'facebook') {
    this.facebookId = socialId;
  }
  
  if (this.authProvider === 'local') {
    this.authProvider = provider;
  }
  
  if (profileData?.picture && !this.profilePicture && !this.avatar) {
    this.profilePicture = profileData.picture;
  }
  
  if (!this.isVerified) {
    this.isVerified = true;
  }
  
  await this.save();
  
  console.log(`[${CURRENT_TIMESTAMP}] Linked ${provider} account to user: ${this.email}`);
};

// Static methods
UserSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email });
};

UserSchema.statics.findBySocialId = function(provider: string, id: string) {
  const query = provider === 'google' 
    ? { googleId: id } 
    : provider === 'facebook' 
      ? { facebookId: id } 
      : null;
  
  if (!query) throw new Error('Invalid social provider');
  return this.findOne(query);
};

UserSchema.statics.createSocialUser = async function(userData: Partial<IUser>) {
  if (!userData.email || !userData.name || (!userData.googleId && !userData.facebookId)) {
    throw new Error('Missing required fields for social user creation');
  }
  
  const user = new this({
    ...userData,
    isVerified: true,
    authProvider: userData.googleId ? 'google' : 'facebook',
    password: crypto.randomBytes(16).toString('hex'),
    isNewUser: true,
  });
  
  await user.save();
  console.log(`[${CURRENT_TIMESTAMP}] Created new user via social auth: ${userData.email}`);
  return user;
};

UserSchema.set('toJSON', {
  transform: function (doc, ret) {
    if (ret._id) {
      ret._id = ret._id.toString();
    }
    delete ret.password;
    return ret;
  }
});

// Create and export the model
const User = (mongoose.models.User as IUserModel) || 
  mongoose.model<IUser, IUserModel>('User', UserSchema);

// Export everything proprement
export default User;
export { User };
export type { IUser, IUserMethods, UserDocument, IUserModel };