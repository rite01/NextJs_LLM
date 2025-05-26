/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Document, Schema, Model, model, Types } from "mongoose";

interface IListing extends Document {
  title: string;
  description: string;
  price: number;
  location: string;
  categoryId: Types.ObjectId;
  attributes: Record<string, any>;
  createdAt: Date;
}

const ListingSchema = new Schema<IListing>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  location: { type: String, required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  attributes: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

ListingSchema.index({ title: "text", description: "text" });
ListingSchema.index({ categoryId: 1 });

const Listing: Model<IListing> =
  mongoose.models.Listing || model<IListing>("Listing", ListingSchema);

export default Listing;
