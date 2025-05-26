/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";

const MONGODB_URI: any = process.env.MONGODB_URI || "Add-Your-MongoDB-URI-Here";
const cached = (global as any).mongoose || { conn: null, promise: null };

export async function dbConnect() {
  if (cached.conn) return cached.conn;

  cached.promise ??= mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
  });

  cached.conn = await cached.promise;
  return cached.conn;
}
