import mongoose, { Document, Schema, Model, model } from "mongoose";

interface IAttribute {
  key: string;
  label: string;
  type: "string" | "number" | "boolean";
  options?: string[];
}

interface ICategory extends Document {
  name: string;
  slug: string;
  attributeSchema: IAttribute[];
}

const AttributeSchema = new Schema<IAttribute>({
  key: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, enum: ["string", "number", "boolean"], required: true },
  options: [{ type: String }],
});

const CategorySchema = new Schema<ICategory>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  attributeSchema: { type: [AttributeSchema], required: true },
});

const Category: Model<ICategory> =
  mongoose.models.Category || model<ICategory>("Category", CategorySchema);

export default Category;
