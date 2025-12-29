import { Injectable } from '@angular/core';
import { ConvexService } from '@/core/services/convex.service';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { CategoryInfo, InventoryStats } from '../interfaces/product.interface';
@Injectable({ 
  providedIn: 'root' 
})
export class ProductsService {
  constructor(private convex: ConvexService) {}

  /**
   * List products with pagination and filters
   */
  async listProducts(
    numItems: number = 50,
    cursor: string | null = null,
    category?: string,
    isActive?: boolean,
    lowStock?: boolean
  ) {
    return this.convex.client.query(api.store.products.listProducts, {
      paginationOpts: {
        numItems,
        cursor,
      },
      category,
      isActive,
      lowStock,
    });
  }

  /**
   * Get single product with images
   */
  async getProduct(productId: Id<'products'>) {
    return this.convex.client.query(api.store.products.getProduct, {
      productId,
    });
  }

  /**
   * Create new product
   */
  async createProduct(productData: {
    name: string;
    description: string;
    category: string;
    price: number;
    discountPrice?: number;
    stock: number;
    lowStockThreshold: number;
    sku: string;
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
  }) {
    return this.convex.client.mutation(api.store.products.createProduct, productData);
  }

  /**
   * Update existing product
   */
  async updateProduct(
    productId: Id<'products'>,
    updates: Partial<{
      name: string;
      description: string;
      category: string;
      price: number;
      discountPrice: number;
      stock: number;
      lowStockThreshold: number;
      isActive: boolean;
      weight: number;
      length: number;
      width: number;
      height: number;
    }>
  ) {
    return this.convex.client.mutation(api.store.products.updateProduct, {
      productId,
      ...updates,
    });
  }

  /**
   * Delete product (soft delete)
   */
  async deleteProduct(productId: Id<'products'>) {
    return this.convex.client.mutation(api.store.products.deleteProduct, {
      productId,
    });
  }

  /**
   * Get product categories
   */
async getCategories(): Promise<CategoryInfo[]> {
  const categories = await this.convex.client.query(api.store.products.getCategories, {});
  return categories.map((c: any) => ({
    _id: c._id ?? c.category,
    count: c.count,
  }));
}


  /**
   * Get inventory statistics
   */
  async getInventoryStats(): Promise<InventoryStats> {
    return this.convex.client.query(api.store.products.getInventoryStats, {});
  }

  /**
   * Add product image
   */
  async addProductImage(
    productId: Id<'products'>,
    storageId: Id<'_storage'>,
    order?: number,
    isPrimary?: boolean
  ) {
    return this.convex.client.mutation(api.store.products.addProductImage, {
      productId,
      storageId,
      order,
      isPrimary,
    });
  }

  /**
   * Remove product image
   */
  async removeProductImage(
    productId: Id<'products'>,
    storageId: Id<'_storage'>
  ) {
    return this.convex.client.mutation(api.store.products.removeProductImage, {
      productId,
      storageId,
    });
  }
}
