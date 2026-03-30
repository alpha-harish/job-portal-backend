const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  console.log("MONGO_URI:", mongoUri);

  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined');
  }

  await mongoose.connect(mongoUri);

  console.log("MongoDB Connected");
};

module.exports = connectDB;