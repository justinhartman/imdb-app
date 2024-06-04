/**
 * User Schema for MongoDB using Mongoose.
 * @module User
 * @description This module exports a Mongoose schema for the User model.
 */

/** @inheritDoc */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User model schema definition.
 * @typedef {Object} SchemaDefinition
 * @property {String} username - The user's unique email which is used as the username.
 * @property {String} password - The user's password.
 */
const definition = {
  username: {
    type: String,
    required: true,
    minlength: 5,
    unique: true,
    match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
    validate: {
      validator: (value) => /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value),
      message: 'Not a valid email address.',
    },
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    maxlength: 255,
    // validate: [
    //   function (password) {
    //     const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    //     return regex.test(password);
    //   },
    //   'Password must contain at least 8 characters, 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.',
    // ],
  },
};

/**
 * User Schema creation.
 * @param {mongoose.Schema} schema - The UserSchema instance.
 * @returns {mongoose.Model<User>} - The User Mongoose model.
 */
const UserSchema = new mongoose.Schema(definition, { timestamps: true });

/**
 * Pre-save hook to hash the user's password before saving it to the database.
 * @param {User} user - The User instance.
 * @param {Function} next - The next callback function to be called in the middleware chain.
 */
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error.message);
  }
});

/**
 * Method to compare the entered password with the hashed password stored in the database.
 * @param {String} password - The password entered by the user.
 * @returns {Promise<Boolean>} - A promise that resolves to true if the passwords match, and false otherwise.
 */
UserSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

/**
 * User Mongoose model.
 * @constructor
 * @returns {mongoose.Model<User>} - The User Mongoose model.
 */
const User = mongoose.model('User', UserSchema);

/**
 * Exports the User Schema instance.
 * @function
 * @returns {mongoose.Model<User>} - The User Mongoose model.
 */
module.exports = User;
