const mongoose = require('mongoose');

// Keeping the DB connection in its own file means app.js stays clean
// and tests can import app.js without triggering a real DB connection.
const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI, {
    maxPoolSize: 10,        // max concurrent connections in the pool
    minPoolSize: 2,         // keep at least 2 connections warm
    serverSelectionTimeoutMS: 5000,   // fail fast if no server found
    socketTimeoutMS: 45000,           // close idle sockets after 45s
    connectTimeoutMS: 10000,          // initial connection timeout
    heartbeatFrequencyMS: 10000,      // how often to check server health
  });
  console.log(`MongoDB connected: ${conn.connection.host}`);
};

module.exports = connectDB;
