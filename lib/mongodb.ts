import mongoose from "mongoose";

const MONGO_URI = process.env.MONGODB_URI;

export const connectDB = async () => {
  try {
    if (!MONGO_URI) {
      throw new Error("Missing MONGODB_URI environment variable");
    }
    if (mongoose.connection.readyState >= 1) {
      console.log("MongoDB connection already established");
      return;
    }

    await mongoose.connect(MONGO_URI, {
      dbName: "interview-ai",
    });

    console.log("mongodb connected successfully");
  } catch (error) {
    console.error("mongodb conncetion error:", error);
    throw error;
  }
};
