import mongoose, { Schema, model } from "mongoose";
const AttributeSchema = new Schema({
    key: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, enum: ["string", "number", "boolean"], required: true },
    options: [{ type: String }],
});
const CategorySchema = new Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    attributeSchema: { type: [AttributeSchema], required: true },
});
const Category = mongoose.models.Category || model("Category", CategorySchema);
export default Category;
