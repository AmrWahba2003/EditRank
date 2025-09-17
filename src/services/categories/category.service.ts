// src/services/categories/category.service.ts
import { Params, Id } from "@feathersjs/feathers";
import { CategoryModel } from "./category.model";

export class CategoryService {
  // جلب جميع التصنيفات
    async find(params?: Params) {
        return await CategoryModel.find();
    }

    // جلب تصنيف واحد
    async get(id: Id, params?: Params) {
        return await CategoryModel.findById(id);
    }

    // إنشاء تصنيف جديد
    async create(data: any, params?: Params) {
        return await CategoryModel.create(data);
    }
}
