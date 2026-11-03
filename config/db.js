import mongoose from "mongoose";
import "dotenv/config";

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI environment variable is required");
  }

  await mongoose.connect(process.env.MONGO_URI);

  console.log("MongoDB connected");
};

export default connectDB;
