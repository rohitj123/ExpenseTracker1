import mongoose from "mongoose";

export const connectDB = async () => {
  const databaseUrl = process.env.MONGODB_URI;

  if (!databaseUrl) {
    throw new Error("MONGODB_URI is required.");
  }

  await mongoose.connect(databaseUrl);
  console.log("Database connected");
};

