/**
 * User collection migration.
 * @module migrations/create-users
 * @description This module contains a migration function that creates a 'users' collection in the database.
 */
module.exports = {
  /**
   * Migrates the database schema by creating a 'users' collection.
   *
   * @param {import('mongodb').Db} db - The MongoDB database instance.
   * @param {import('mongodb').MongoClient} client - The MongoDB client instance.
   *
   * @returns {Promise<void>} A Promise that resolves when the migration is complete.
   */
  async up(db, client) {
    await db.createCollection('users');
  },

  /**
   * Migrates the database schema by dropping the 'users' collection.
   *
   * @param {import('mongodb').Db} db - The MongoDB database instance.
   * @param {import('mongodb').MongoClient} client - The MongoDB client instance.
   *
   * @returns {Promise<void>} A Promise that resolves when the migration is complete.
   */
  async down(db, client) {
    await db.collection('users').drop();
  }
};
