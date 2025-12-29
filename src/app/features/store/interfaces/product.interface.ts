import { Id } from "convex/_generated/dataModel";

export interface Product {
  _id: Id<'products'>;
  _creationTime: number;
  rootId: string;
  name: string;
  description: string;
  category: string;
  price: number;
  discountPrice?: number;
  stock: number;
  lowStockThreshold: number;
  sku: string;
  isActive: boolean;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  createdAt: number;
  updatedAt: number;
}

// ✅ Fixed: Backend returns '_id' not 'category'
export interface CategoryInfo {
  _id: string;  // ✅ Changed from 'category'
  count: number;
}

// ✅ Fixed: Removed 'inactiveProducts' (backend doesn't return it)
export interface InventoryStats {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalInventoryValue: number;
}
