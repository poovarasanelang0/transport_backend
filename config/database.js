const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("Database connection attempt...");
    console.log("MongoDB URI:", process.env.MONGODB_URI ? "Set" : "Not set");

    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is not set");
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
