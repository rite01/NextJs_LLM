/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";

const MONGODB_URI: any =
  process.env.MONGODB_URI ||
  "mongodb+srv://ritesh:4o4y4AIsijmtt3RD@cluster0.5fvzn0m.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const cached = (global as any).mongoose || { conn: null, promise: null };

export async function dbConnect() {
  if (cached.conn) return cached.conn;

  cached.promise ??= mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
  });

  cached.conn = await cached.promise;
  return cached.conn;
}
