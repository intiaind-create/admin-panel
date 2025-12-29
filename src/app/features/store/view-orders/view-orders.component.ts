import { Component, OnInit, signal, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';

import { OrdersService } from '../services/orders.service';
import { Order, OrderItem, OrderStats } from '../interfaces/order.interface';
import { UserService } from '@/features/user-management/user.service';

@Component({
  selector: 'app-view-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    ToastModule,
    SelectModule,
    DialogModule,
    InputNumberModule,
  ],
  encapsulation:ViewEncapsulation.None,
  templateUrl: './view-orders.component.html',
  styleUrls: ['./view-orders.component.scss'],
  providers: [MessageService],
  
})
export class ViewOrdersComponent implements OnInit {
  @ViewChild('dt') dt!: Table;

  orders = signal<Order[]>([]);
  filteredOrders: Order[] = [];
  stats = signal<OrderStats & { totalOrdersToday?: number; weeklyRevenue?: number }>({
    totalOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
  });

  selectedOrder: Order | null = null;
  orderItems = signal<OrderItem[]>([]);
  orderDetailsVisible = false;
  loading = signal(false);

  searchQuery = '';
  selectedStatus: string | null = null;

  statusOptions = [
    { label: 'All', value: null },
    { label: 'Pending', value: 'pending' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' },
  ];
  
dateRangeOptions = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 days', value: 'last7' },
  { label: 'Last 30 days', value: 'last30' },
  { label: 'All time', value: 'all' },
];
selectedDateRange: 'today' | 'last7' | 'last30' | 'all' = 'last7';
selectedExecutiveId: string | null = null;

executiveFilterOptions: { label: string; value: string | null }[] = [
  { label: 'All executives', value: null },
  // after loadData, push { label: exec.name, value: exec._id }
];
  // Executive lookup
  private executivesById = new Map<string, { name: string; phone?: string }>();

  constructor(
    private ordersService: OrdersService,
    private userService: UserService,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  // -------- DATA LOAD --------
 private async loadData() {
    this.loading.set(true);
    try {
      const [ordersResult, statsResult, execResult] = await Promise.all([
        this.ordersService.listOrders({
          status: this.selectedStatus ?? undefined,
          executiveId: this.selectedExecutiveId ?? undefined,
        }),
        this.ordersService.getOrderStats(),
        this.userService.getExecutives(
          { numItems: 500, cursor: null },
          { isActive: true },
        ),
      ]);

      const rawOrders = (ordersResult as any).page ?? ordersResult;
console.log('LIST ORDERS RAW LENGTH:', (rawOrders as any[]).length);
console.log('LIST ORDERS SAMPLE:', rawOrders.slice(0, 5));
      const normalizedOrders = (rawOrders as any[]).map((o) => {
        const subtotal = o.subtotal ?? 0;
        const discount = o.discount ?? 0;
        const tax = o.tax ?? 0;
        const shipping = o.shippingCost ?? 0;

        const computedTotal =
          o.totalAmount != null
            ? o.totalAmount
            : subtotal - discount + tax + shipping;

        return {
          ...o,
          customerName: o.customerName ?? 'N/A',
          customerEmail: o.customerEmail ?? 'N/A',
          totalAmount: computedTotal,
        } as Order & { executiveName?: string };
      });

      this.orders.set(normalizedOrders);

      // Stats (Convex already computes a lot; you can extend later)
      this.stats.set(statsResult as any);

      // Executives lookup + filter options
      const execList = (execResult as any).page ?? execResult;
      this.executivesById.clear();
      const filterOptions: { label: string; value: string | null }[] = [
        { label: 'All executives', value: null },
      ];

      for (const e of execList as any[]) {
        const rawId = (e as any)._id ?? (e as any).id ?? e.id;
        const key = String(rawId);
        let fullName: string | undefined = e.name;
        if (!fullName) {
          fullName = `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim();
        }
        if (!fullName) {
          fullName = 'Unknown';
        }

        this.executivesById.set(key, {
          name: fullName,
          phone: e.phone,
        });

        filterOptions.push({
          label: fullName,
          value: key,
        });
      }

      this.executiveFilterOptions = filterOptions;

      this.applyFilters();
    } catch (err) {
      console.error('LOAD DATA ERROR:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load orders',
      });
    } finally {
      this.loading.set(false);
    }
  }


getExecutiveName(order: Order): string {
  // Prefer per-order name from API; fall back to map if needed
  if (order.executiveName) {
    return order.executiveName;
  }

  const ex = this.executivesById.get(String(order.executiveId));
  return ex?.name || 'Unknown';
}

  // -------- FILTERING --------
  onSearch() {
    this.applyFilters();
  }

  onStatusFilter() {
    this.applyFilters();
  }

private applyFilters() {
    const all = this.orders();
    const now = Date.now();

    let from: number | null = null;

    switch (this.selectedDateRange) {
      case 'today':
        from = new Date(
          new Date().setHours(0, 0, 0, 0),
        ).getTime();
        break;
      case 'last7':
        from = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case 'last30':
        from = now - 30 * 24 * 60 * 60 * 1000;
        break;
      case 'all':
      default:
        from = null;
    }

    let filtered = all;

    if (from != null) {
      filtered = filtered.filter((o) => o.createdAt >= from);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter((o: any) => {
        const id = (o.orderNumber ?? String(o._id).slice(0, 8)).toLowerCase();
        const customer = (o.customerName ?? '').toLowerCase();
        const email = (o.customerEmail ?? '').toLowerCase();
        const exec = (o.executiveName ??
          this.getExecutiveName(o as Order & { executiveName?: string })).toLowerCase();

        return (
          id.includes(q) ||
          customer.includes(q) ||
          email.includes(q) ||
          exec.includes(q)
        );
      });
    }

    this.filteredOrders = filtered;
  }
  onQuickFilter(
    kind: 'today' | 'pending' | 'shipped' | 'delivered' | 'revenue7',
  ) {
    if (kind === 'today') {
      this.selectedDateRange = 'today';
      this.selectedStatus = null;
      this.applyFilters();
      return;
    }

    if (kind === 'pending' || kind === 'shipped' || kind === 'delivered') {
      this.selectedStatus = kind;
      this.selectedDateRange = 'last7';
      this.loadData();
      return;
    }

    if (kind === 'revenue7') {
      this.selectedDateRange = 'last7';
      // status left as-is; card is mainly about range
      this.applyFilters();
    }
  }
  onClearFilters() {
    this.searchQuery = '';
    this.selectedStatus = null;
    this.selectedExecutiveId = null;
    this.selectedDateRange = 'last7';
    this.loadData();
  }

  onExecutiveFilterChange() {
    this.loadData();
  }
  onDateRangeChange() {
    this.applyFilters();
  }
  // -------- DETAILS + ITEMS --------
  async viewOrderDetails(order: Order) {
    this.selectedOrder = order;
    this.orderItems.set([]);
    this.orderDetailsVisible = true;
    this.loading.set(true);

    try {
      const fullOrder = await this.ordersService.getOrder(order._id);

      if (fullOrder) {
        // merge full order so dialog + invoice see the same data
        this.selectedOrder = { ...order, ...(fullOrder as any) } as Order;

        if ('items' in fullOrder) {
          this.orderItems.set(
            ((fullOrder as any).items || []) as OrderItem[],
          );
        }
      }
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load order items',
      });
    } finally {
      this.loading.set(false);
    }
  }

  // -------- HELPERS --------
  formatCurrency(value: number | undefined | null): string {
    const n = value ?? 0;
    return `₹${n.toFixed(2)}`;
  }

  getStatusSeverity(
    status: string,
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<
      string,
      'success' | 'info' | 'warn' | 'danger' | 'secondary'
    > = {
      pending: 'warn',
      confirmed: 'info',
      shipped: 'info',
      delivered: 'success',
      cancelled: 'danger',
    };
    return map[status.toLowerCase()] || 'secondary';
  }

  // -------- REFRESH + EXPORT --------
  refreshOrders() {
    this.loadData();
    this.messageService.add({
      severity: 'success',
      summary: 'Refreshed',
      detail: 'Orders data reloaded',
    });
  }

  exportOrders() {
    const headers = [
      'Order ID',
      'Executive',
      'Customer',
      'Email',
      'Phone',
      'Amount',
      'Status',
      'Payment Status',
      'Date',
    ];

    const data = this.filteredOrders.map((order) => [
      order.orderNumber ?? String(order._id).substring(0, 8),
      this.getExecutiveName(order),
      order.customerName ?? '',
      order.customerEmail ?? '',
      order.customerPhone ?? '',
      (order.totalAmount ?? 0).toString(),
      order.status ?? '',
      order.paymentStatus ?? '',
      new Date(order.createdAt).toLocaleDateString('en-IN'),
    ]);

    const csv = [headers, ...data].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders-${new Date()
      .toISOString()
      .split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Orders exported successfully',
    });
  }

  // -------- INVOICE PRINTING --------
  async downloadInvoice(order: Order) {
    if (!this.selectedOrder || this.selectedOrder._id !== order._id) {
      await this.viewOrderDetails(order);
    }
    if (this.selectedOrder) {
      this.printOrder(this.selectedOrder);
    }
  }

  printOrder(order: Order) {
    const items = this.orderItems();

    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;

    const itemsRows = items
      .map(
        (item) => `
        <tr>
          <td>
            ${item.productName || 'N/A'}
            <br /><small style="color: #6b7280;">SKU: ${
              item.productSku || 'N/A'
            }</small>
          </td>
          <td style="text-align: center;">${item.quantity || 0}</td>
          <td style="text-align: right;">₹${(item.unitPrice ?? 0).toFixed(
            2,
          )}</td>
          <td style="text-align: right;">₹${(item.totalPrice ?? 0).toFixed(
            2,
          )}</td>
        </tr>`,
      )
      .join('');

    const safeOrderId = (
      order.orderNumber ?? String(order._id).substring(0, 8) ?? 'N/A'
    )
      .toString()
      .toUpperCase();

    const safeStatus = (order.status ?? 'N/A').toString().toUpperCase();
    const safePaymentStatus = (order.paymentStatus ?? 'N/A')
      .toString()
      .toUpperCase();

    const executiveName = this.getExecutiveName(order);

    const subtotal = order.subtotal ?? 0;
    const discount = order.discount ?? 0;
    const tax = order.tax ?? 0;
    const shipping = order.shippingCost ?? 0;
    const total =
      order.totalAmount ?? subtotal - discount + tax + shipping;

    printWindow.document.write(`
      <html>
        <head>
          <title>Order Invoice - ${safeOrderId}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #111827;
              padding-bottom: 20px;
            }
            .header h1 {
              margin: 0 0 10px 0;
              color: #111827;
            }
            .section {
              margin-bottom: 25px;
            }
            .section h3 {
              margin: 0 0 10px 0;
              color: #111827;
            }
            .label {
              font-weight: bold;
              color: #374151;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th, td {
              border: 1px solid #e5e7eb;
              padding: 10px;
              text-align: left;
              font-size: 0.875rem;
            }
            th {
              background-color: #f9fafb;
              font-weight: 600;
              color: #374151;
            }
            tfoot td {
              font-weight: 500;
            }
            tfoot tr:last-child td {
              font-weight: 700;
              font-size: 1.1em;
              background-color: #f9fafb;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 20px;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Order Invoice</h1>
            <p style="margin: 5px 0; color: #6b7280;">
              Order ID: <strong>${safeOrderId}</strong>
            </p>
            <p style="margin: 5px 0; color: #6b7280;">
              Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <div class="info-grid">
            <div class="section">
              <h3>Executive Information</h3>
              <p><span class="label">Name: </span>${executiveName}</p>
            </div>

            <div class="section">
              <h3>Customer Information</h3>
              <p><span class="label">Name: </span>${order.customerName ?? 'N/A'}</p>
              <p><span class="label">Email: </span>${order.customerEmail ?? 'N/A'}</p>
              <p><span class="label">Phone: </span>${order.customerPhone ?? 'N/A'}</p>
            </div>
          </div>

          <div class="section">
            <h3>Shipping Address</h3>
            <p><span class="label">Ship To: </span>${order.shipToName ?? 'N/A'}</p>
            <p><span class="label">Phone: </span>${order.shipToPhone ?? 'N/A'}</p>
            <p>${order.shipToAddress ?? 'N/A'}</p>
            <p>
              ${order.shipToCity ?? 'N/A'}, 
              ${order.shipToState ?? 'N/A'} - 
              ${order.shipToPincode ?? 'N/A'}
            </p>
          </div>

          <div class="section">
            <h3>Order Items</h3>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th style="text-align: center; width: 100px;">Quantity</th>
                  <th style="text-align: right; width: 120px;">Unit Price</th>
                  <th style="text-align: right; width: 120px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="text-align: right;">Subtotal:</td>
                  <td style="text-align: right;">₹${subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="3" style="text-align: right;">Discount:</td>
                  <td style="text-align: right;">-₹${discount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="3" style="text-align: right;">Tax:</td>
                  <td style="text-align: right;">₹${tax.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="3" style="text-align: right;">Shipping:</td>
                  <td style="text-align: right;">₹${shipping.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="3" style="text-align: right;"><strong>Final Amount:</strong></td>
                  <td style="text-align: right;"><strong>₹${total.toFixed(2)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div class="section">
            <h3>Order Details</h3>
            <p><span class="label">Status: </span>${safeStatus}</p>
            <p><span class="label">Payment Status: </span>${safePaymentStatus}</p>
            <p><span class="label">Payment Method: </span>${order.paymentMethod ?? 'N/A'}</p>
            ${
              order.trackingNumber
                ? `<p><span class="label">Tracking Number: </span>${order.trackingNumber}</p>`
                : ''
            }
            ${
              order.notes
                ? `<p><span class="label">Notes: </span>${order.notes}</p>`
                : ''
            }
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }
}
