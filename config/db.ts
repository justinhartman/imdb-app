/**
 * Mongoose configuration to connect to MongoDB database using Mongoose.
 * @module config/db
 * @description This module exports a function that connects to the MongoDB database using Mongoose.
 */

import mongoose from 'mongoose';
import appConfig from './app';

/**
 * Connects to the MongoDB database using Mongoose.
 * @returns {Promise<void>} A Promise that resolves when the database is connected.
 */
const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(appConfig.MONGO_DB_URI, {
      dbName: appConfig.MONGO_DB_NAME,
      family: 4,
    });
    console.log('MongoDB Connected');
  } catch (error: any) {
    console.error(error.message);
    process.exit(1);
  }
};

export default connectDB;

