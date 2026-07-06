import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoURL =
      process.env.MONGODB_URI || "mongodb://localhost:27017/edtech";

    // Try to connect with a timeout
    await Promise.race([
      mongoose.connect(mongoURL),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("MongoDB connection timeout")), 5000),
      ),
    ]);

    console.log("[MongoDB] Connected successfully");
    return mongoose.connection;
  } catch (error) {
    console.error("[MongoDB] Connection failed:", error.message);
    throw error;
  }
};

export default connectDB;
