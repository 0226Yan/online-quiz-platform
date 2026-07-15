const mongoose = require('mongoose');

// Connect to MongoDB using the connection string in MONGO_URI.
const connectDB = async () => {
  try {
    // Create the connection (Mongoose manages pooling internally).
    const conn = await mongoose.connect(process.env.MONGO_URI);
    // Log the host so we can confirm which DB we connected to.
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    // Fail fast on startup if DB is not reachable/configured correctly.
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

// Export a single startup helper used by server.js.
module.exports = connectDB;
