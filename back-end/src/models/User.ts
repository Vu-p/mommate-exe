import mongoose, { Schema, Document } from 'mongoose';

export enum UserRole {
  PARENT = 'parent',
  CARER = 'carer',
  ADMIN = 'admin'
}

export interface IUser extends Document {
  email: string;
  password: string;
  firebaseUid?: string;
  authProvider?: 'local' | 'google';
  role: UserRole;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  avatar?: string;
  address?: string;
  birthDate?: Date;
  gender?: string;
  identityNumber?: string;
  identityName?: string;
  identityIssuedAt?: Date;
  identityImages?: string[];
  mustChangePassword: boolean;
  accountStatus: 'active' | 'suspended';
  suspendedAt?: Date;
  suspendedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firebaseUid: { type: String, unique: true, sparse: true },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  role: { type: String, enum: Object.values(UserRole), default: UserRole.PARENT },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phoneNumber: { type: String },
  avatar: { type: String },
  address: { type: String },
  birthDate: { type: Date },
  gender: { type: String },
  identityNumber: { type: String },
  identityName: { type: String },
  identityIssuedAt: { type: Date },
  identityImages: [{ type: String }],
  mustChangePassword: { type: Boolean, default: false },
  accountStatus: { type: String, enum: ['active', 'suspended'], default: 'active', index: true },
  suspendedAt: { type: Date },
  suspendedReason: { type: String },
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
