const dns = require('dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);

require('dotenv').config();

require('./config/validateEnv');

const config = require('./config/config');

const app = require('./app');
const connectDB = require('./config/db');
const mongoose = require('mongoose');

const PORT = config.port;

let server;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectWithRetry = async (maxRetries = 5, delayMs = 2000) => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      attempt += 1;
      await connectDB();
      return;
    } catch (err) {
      console.error(`MongoDB connection failed (attempt ${attempt}/${maxRetries}):`, err.message);
      if (attempt >= maxRetries) throw err;
      await sleep(delayMs);
    }
  }
};

const shutdown = async (signal) => {
  try {
    console.log(`${signal} received. Shutting down gracefully...`);

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }

    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    process.exit(0);
  } catch (err) {
    console.error('Graceful shutdown failed:', err.message);
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

const start = async () => {
  try {
    await connectWithRetry(5, 2000);
    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

start();