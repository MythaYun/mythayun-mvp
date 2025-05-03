import mongoose from 'mongoose';

// Session interface
export interface ISession {
  userId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  userAgent: string;
  ipAddress: string;
  isValid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Define the schema
const SessionSchema = new mongoose.Schema<ISession>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    token: {
      type: String,
      required: true,
      unique: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    userAgent: {
      type: String,
      required: true
    },
    ipAddress: {
      type: String,
      required: true
    },
    isValid: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Index to quickly find and clean up expired sessions
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index to quickly find sessions by user and validity
SessionSchema.index({ userId: 1, isValid: 1 });

// Create the model
const Session = mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);

export default Session;