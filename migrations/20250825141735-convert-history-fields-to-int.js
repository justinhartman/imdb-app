module.exports = {
  async up(db) {
    const COLLECTION = 'histories';
    const col = db.collection(COLLECTION);

    // If you ever stored season/episode under legacy keys, fold them in first.
    // This only copies when lastSeason/lastEpisode are missing; then removes the legacy keys.
    await col.updateMany(
      { $or: [{ season: { $exists: true } }, { episode: { $exists: true } }] },
      [
        {
          $set: {
            lastSeason: {
              $cond: [
                { $and: [{ $ne: ["$season", null] }, { $or: [{ $eq: ["$lastSeason", null] }, { $not: [{ $gt: ["$lastSeason", null] }] }] }] },
                "$season",
                "$lastSeason"
              ]
            },
            lastEpisode: {
              $cond: [
                { $and: [{ $ne: ["$episode", null] }, { $or: [{ $eq: ["$lastEpisode", null] }, { $not: [{ $gt: ["$lastEpisode", null] }] }] }] },
                "$episode",
                "$lastEpisode"
              ]
            }
          }
        },
        { $unset: ["season", "episode"] }
      ]
    );

    // Convert strings (and other coercible types) -> int; leave existing numbers as-is.
    await col.updateMany(
      {
        $or: [
          { lastSeason: { $type: "string" } },
          { lastEpisode: { $type: "string" } }
        ]
      },
      [
        {
          $set: {
            lastSeason: {
              $convert: {
                input: "$lastSeason",
                to: "int",
                onError: "$lastSeason", // keep original if not numeric (safety)
                onNull: "$lastSeason"
              }
            },
            lastEpisode: {
              $convert: {
                input: "$lastEpisode",
                to: "int",
                onError: "$lastEpisode",
                onNull: "$lastEpisode"
              }
            }
          }
        }
      ]
    );

    // Optional: also coerce numeric strings that slipped through legacy keys above
    await col.updateMany(
      {
        $or: [
          { lastSeason: { $type: "double" } },
          { lastEpisode: { $type: "double" } },
          { lastSeason: { $type: "long" } },
          { lastEpisode: { $type: "long" } }
        ]
      },
      [
        {
          $set: {
            lastSeason: {
              $convert: {
                input: "$lastSeason",
                to: "int",
                onError: "$lastSeason",
                onNull: "$lastSeason"
              }
            },
            lastEpisode: {
              $convert: {
                input: "$lastEpisode",
                to: "int",
                onError: "$lastEpisode",
                onNull: "$lastEpisode"
              }
            }
          }
        }
      ]
    );
  },

  async down(db) {
    const COLLECTION = 'histories';
    const col = db.collection(COLLECTION);

    // Revert ints/longs back to strings (best-effort).
    await col.updateMany(
      {
        $or: [
          { lastSeason: { $type: "int" } },
          { lastEpisode: { $type: "int" } },
          { lastSeason: { $type: "long" } },
          { lastEpisode: { $type: "long" } }
        ]
      },
      [
        {
          $set: {
            lastSeason: {
              $convert: {
                input: "$lastSeason",
                to: "string",
                onError: "$lastSeason",
                onNull: "$lastSeason"
              }
            },
            lastEpisode: {
              $convert: {
                input: "$lastEpisode",
                to: "string",
                onError: "$lastEpisode",
                onNull: "$lastEpisode"
              }
            }
          }
        }
      ]
    );
  }
};