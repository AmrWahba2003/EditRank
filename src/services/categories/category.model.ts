// src/services/categories/category.model.ts
import { Schema, model, Document } from "mongoose";

export interface ICategory extends Document {
  name: string;            // هيكون "Games"
  subcategories: string[]; // أسماء الألعاب (GTA V, FIFA, COD...)
}

const categorySchema = new Schema<ICategory>({
    name: { type: String, required: true, unique: true },
    subcategories: [{ type: String, required: true }]
});

export const CategoryModel = model<ICategory>("Category", categorySchema);