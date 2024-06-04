const mongoose = require('mongoose');

/**
 * Watchlist collection migration.
 * @module migrations/migrateWatchlists
 * @description This module contains a migration function that creates a 'watchlist' collection in the database.
 */
module.exports = {
  /**
   * This function migrates the 'watchlist' field from 'users' collection to a new 'watchlists' collection.
   * @param {Object} db - The MongoDB database instance.
   * @param {Object} client - The MongoDB client instance.
   * @returns {Promise<void>}
   */
  async up(db, client) {
    const session = client.startSession();
    const users = await db.collection('users').find({ watchlist: { $exists: true, $ne: [] } }).toArray();
    const watchlists = users.map(user => ({
      userId: user._id,
      items: user.watchlist.map(item => ({
        _id: new mongoose.Types.ObjectId(),
        type: item.type,
        imdbId: item.imdbID,
        title: item.title,
        poster: item.poster,
      })),
    }));

    try {
      await session.withTransaction(async () => {
        if (watchlists.length > 0) await db.collection('watchlists').insertMany(watchlists);
        await db.collection('users').updateMany({}, { $unset: { watchlist: 1 } });
      });
    } finally {
      await session.endSession();
    }
  },

  /**
   * This function reverts the migration by moving the 'watchlist' items back to the 'users' collection.
   * @param {Object} db - The MongoDB database instance.
   * @param {Object} client - The MongoDB client instance.
   * @returns {Promise<void>}
   */
  async down(db, client) {
    const session = client.startSession();
    const watchlists = await db.collection('watchlists').find().toArray();

    try {
      await session.withTransaction(async () => {
        for (const watchlist of watchlists) {
          await db.collection('users').updateOne(
            { _id: watchlist.userId },
            {
              $set: {
                watchlist: watchlist.items,
              },
            }
          );
        }
        await db.collection('watchlists').deleteMany({});
      });
    } finally {
      await session.endSession();
    }
  },
};
