/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Schema, model } from "mongoose";
const ListingSchema = new Schema({
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
const Listing = mongoose.models.Listing || model("Listing", ListingSchema);
export default Listing;
