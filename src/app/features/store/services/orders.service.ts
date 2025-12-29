import { Injectable } from '@angular/core';
import { ConvexService } from 'src/app/core/services/convex.service';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { Order } from '../interfaces/order.interface';

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  constructor(private convex: ConvexService) {}

async listOrders(filters?: {
  status?: string;
  executiveId?: string;
  paginationOpts?: any;
}) {
  // Default pagination if not provided
  const pagination = filters?.paginationOpts ?? { numItems: 100, cursor: null };
  
  return this.convex.query(api.store.orders.listOrders, {
    paginationOpts: pagination,
    status: filters?.status as any,
    executiveId: filters?.executiveId as any,
  });
}


  async getOrder(orderId: Id<'orders'>) {
    return this.convex.client.query(api.store.orders.getOrder, { orderId });
  }

  async getOrderStats() {
    
    return this.convex.client.query(api.store.orders.getOrderStats, {});
  }

  // ✅ FIXED: Backend only accepts 'confirmed' | 'shipped' | 'delivered' | 'cancelled' (NO 'pending')
  async updateOrderStatus(
    orderId: Id<'orders'>,
    status: 'confirmed' | 'shipped' | 'delivered' | 'cancelled',  // ✅ Removed 'pending'
    trackingNumber?: string,
    notes?: string
  ) {
    return this.convex.client.mutation(api.store.orders.updateOrderStatus, {
      orderId,
      status,
      trackingNumber,
    });
  }

  async createOrder(orderData: {
    executiveId: Id<'executives'>;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shipToName: string;
    shipToPhone: string;
    shipToAddress: string;
    shipToCity: string;
    shipToState: string;
    shipToPincode: string;
    paymentMethod: string;
    items: Array<{ productId: Id<'products'>; quantity: number }>;
    discount?: number;
    notes?: string;
  }) {
    return this.convex.client.mutation(api.store.orders.createOrder, orderData);
  }
}
