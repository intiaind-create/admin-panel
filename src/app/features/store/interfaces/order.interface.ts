import { Id } from "convex/_generated/dataModel";

export interface OrderItem {
  _id: Id<'order_items'>;
  _creationTime: number;
  orderId: Id<'orders'>;
  rootId: string;
  productId: Id<'products'>;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: number;
}

export interface Order {
  _id: Id<'orders'>;
  orderNumber?: string;

  executiveId: Id<'executives'>;
  executiveEmployeeId?: string;
  executiveName?: string; // <-- add this

  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shipToName: string;
  shipToPhone: string;
  shipToAddress: string;
  shipToCity: string;
  shipToState: string;
  shipToPincode: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  subtotal: number;
  discount: number;
  tax: number;
  shippingCost: number;
  totalAmount: number;
  trackingNumber?: string;
  shippedAt?: number;
  deliveredAt?: number;
  notes?: string;
  createdAt: number;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
}
