/**
 * @module models/User
 * @description Mongoose model for managing users.
 */

import mongoose, { CallbackWithoutResultAndOptionalError, Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Interface representing a User document in MongoDB.
 * @interface IUser
 * @extends {Document}
 */
export interface IUser extends Document {
  username: string;
  password: string;
  matchPassword(password: string): Promise<boolean>;
}

/**
 * Schema definition for User model.
 * @const {Record<string, any>}
 */
const definition: Record<string, any> = {
  username: {
    type: String,
    required: true,
    minlength: 5,
    unique: true,
    match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
    validate: {
      validator: (value: string) =>
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value),
      message: 'Not a valid email address.',
    },
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    maxlength: 255,
  },
};

const UserSchema = new Schema<IUser>(definition, { timestamps: true });

/**
 * Pre-save hook to hash password before saving to database.
 * @param {CallbackWithoutResultAndOptionalError} next - Mongoose middleware next function
 */
UserSchema.pre<IUser>('save', async function (next: CallbackWithoutResultAndOptionalError) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

/**
 * Compare provided password with stored hashed password.
 * @param {string} password - Password to compare
 * @returns {Promise<boolean>} True if passwords match, false otherwise
 */
UserSchema.methods.matchPassword = async function (password: string): Promise<boolean> {
  return await bcrypt.compare(password, this.password);
};

/**
 * Mongoose model for User.
 * @const {Model<IUser>}
 */
const User = mongoose.model<IUser>('User', UserSchema);
export default User;

