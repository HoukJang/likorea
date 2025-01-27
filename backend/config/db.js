require('dotenv').config();

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Atlas에서 확인한 Connection String
    await mongoose.connect(process.env.ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB Atlas Connected!");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

module.exports = connectDB;
