/**
 * @module models/User
 * @description Mongoose model for managing users.
 */

import mongoose, { CallbackWithoutResultAndOptionalError, Schema } from 'mongoose';
import type { IUser } from '../types/interfaces';
import bcrypt from 'bcryptjs';

/**
 * @const definition
 * @description User schema definition object.
 * @type {Record<string, any>}
 */
const definition: Record<string, any> = {
  /**
   * User's email address used as username.
   * @type {String}
   * @required
   * @unique
   * @minlength 8
   */
  username: {
    type: String,
    required: true,
    minlength: 8,
    unique: true,
    match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
    /**
     * Validates email format.
     * @param {string} value - Email address to validate
     * @returns {boolean} True if email format is valid
     */
    validate: {
      validator: (value: string) =>
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value),
      message: 'Not a valid email address.',
    },
  },
  /**
   * User's password (stored as hash).
   * @type {String}
   * @required
   * @minlength 8
   * @maxlength 255
   */
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
 * Represents a user in the system with authentication capabilities.
 * @const {Model<IUser>}
 * @description This model handles user data storage and authentication.
 * It includes methods for password hashing and verification.
 * @example
 * // Create a new user
 * const user = new User({ username: 'user@example.com', password: 'password123' });
 * await user.save();
 *
 * // Verify password
 * const isMatch = await user.matchPassword('password123');
 */
const User = mongoose.model<IUser>('User', UserSchema);
export default User;
