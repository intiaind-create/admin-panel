import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// --- PrimeNG Modules ---
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { EditorModule } from 'primeng/editor';
import { MenuModule } from 'primeng/menu';
import { Injectable } from '@angular/core';
import { Product } from '../interfaces/product.interface';
import { ProductsService } from '../services/product.service';
import saveAs from 'file-saver';
import { Workbook } from 'exceljs';

// --- Data Interface for a Product ---
@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    FormsModule,
    ButtonModule,
    ToastModule,
    ToolbarModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DialogModule,
    TagModule,
    ConfirmDialogModule,
    EditorModule,
    MenuModule,
  ],
  templateUrl: './product-management.component.html',
  providers: [MessageService, ConfirmationService],
})
export class ProductManagementComponent implements OnInit {
  @ViewChild('dt') dt!: Table;

  productDialog = false;
  products = signal<Product[]>([]);
  product: Partial<Product> = {};
  selectedProducts: Product[] | null = [];
  submitted = false;
  loading = signal<boolean>(false);

  categories: any[] = [];
  statuses: any[] = [];
  actionMenuItems: MenuItem[] = [];

  constructor(
    private productsService: ProductsService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  async ngOnInit() {
    await this.loadProducts();

    this.statuses = [
      { label: 'Active', value: true },
      { label: 'Inactive', value: false },
    ];
  }

  /**
   * Load products from backend
   */
  async loadProducts() {
    this.loading.set(true);
    try {
      const result = await this.productsService.listProducts(100); // Load first 100
      this.products.set(result.page as Product[]);
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to load products',
      });
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Load categories from backend
   */


  /**
   * Open dialog for new product
   */
  openNew() {
    this.product = {
      stock: 0,
      lowStockThreshold: 10,
      isActive: true,
    };
    this.submitted = false;
    this.productDialog = true;
  }

  /**
   * Edit existing product
   */
  async editProduct(product: Product) {
    try {
      // Fetch full product details including images
      const fullProduct = await this.productsService.getProduct(product._id);
      this.product = { ...fullProduct };
      this.productDialog = true;
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to load product details',
      });
    }
  }

  /**
   * Delete product
   */
  async deleteProduct(product: Product) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${product.name}"?`,
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          await this.productsService.deleteProduct(product._id);

          // Remove from UI
          this.products.update((products) =>
            products.filter((p) => p._id !== product._id)
          );

          this.messageService.add({
            severity: 'success',
            summary: 'Successful',
            detail: 'Product Deleted',
            life: 3000,
          });
        } catch (error: any) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to delete product',
          });
        }
      },
    });
  }

  /**
   * Hide dialog
   */
  hideDialog() {
    this.productDialog = false;
    this.submitted = false;
  }

  /**
   * Save product (create or update)
   */
  async saveProduct() {
    this.submitted = true;

    if (!this.product.name?.trim() || !this.product.sku?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Name and SKU are required',
      });
      return;
    }

    if (!this.product.price || this.product.price <= 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Price must be greater than 0',
      });
      return;
    }

    this.loading.set(true);

    try {
      if (this.product._id) {
        // Update existing product
        await this.productsService.updateProduct(this.product._id, {
          name: this.product.name,
          description: this.product.description,
          category: this.product.category,
          price: this.product.price,
          discountPrice: this.product.discountPrice,
          stock: this.product.stock,
          lowStockThreshold: this.product.lowStockThreshold,
          isActive: this.product.isActive,
          weight: this.product.weight,
          length: this.product.length,
          width: this.product.width,
          height: this.product.height,
        });

        this.messageService.add({
          severity: 'success',
          summary: 'Successful',
          detail: 'Product Updated',
          life: 3000,
        });
      } else {
        // Create new product
        await this.productsService.createProduct({
          name: this.product.name!,
          description: this.product.description || '',
          category: this.product.category || 'General',
          price: this.product.price!,
          discountPrice: this.product.discountPrice,
          stock: this.product.stock || 0,
          lowStockThreshold: this.product.lowStockThreshold || 10,
          sku: this.product.sku!,
          weight: this.product.weight,
          length: this.product.length,
          width: this.product.width,
          height: this.product.height,
        });

        this.messageService.add({
          severity: 'success',
          summary: 'Successful',
          detail: 'Product Created',
          life: 3000,
        });
      }

      // Reload products
      await this.loadProducts();

      this.productDialog = false;
      this.product = {};
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to save product',
      });
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Get stock status severity
   */
  getStockSeverity(product: Product): 'success' | 'warn' | 'danger' {
    if (product.stock === 0) return 'danger';
    return 'success';
  }

  /**
   * Get stock status label
   */
  getStockLabel(product: Product): string {
    if (product.stock === 0) return 'OUT OF STOCK';
    return 'IN STOCK';
  }

  /**
   * Actions menu
   */
  onActionsMenuClick(menu: any, event: any, product: Product) {
    this.actionMenuItems = [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => this.editProduct(product),
      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        command: () => this.deleteProduct(product),
      },
    ];
    menu.toggle(event);
  }

  /**
   * Global filter
   */
  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

   async exportToExcel() {
    const currentProducts = this.products();
    
    if (currentProducts.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Data',
        detail: 'No products to export',
      });
      return;
    }

    try {
      const workbook = new Workbook();
      workbook.creator = 'Admin Panel';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('Products');

      worksheet.columns = [
        { header: 'SKU', key: 'sku', width: 15 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Category', key: 'category', width: 15 },
        { header: 'Price', key: 'price', width: 12 },
        { header: 'Discount Price', key: 'discountPrice', width: 15 },
        { header: 'Stock', key: 'stock', width: 10 },
        { header: 'Low Stock Threshold', key: 'lowStockThreshold', width: 20 },
        { header: 'Status', key: 'status', width: 10 },
        { header: 'Stock Status', key: 'stockStatus', width: 15 },
        { header: 'Created', key: 'created', width: 15 },
      ];

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      currentProducts.forEach((product) => {
        worksheet.addRow({
          sku: this.sanitizeCell(product.sku),
          name: this.sanitizeCell(product.name),
          category: this.sanitizeCell(product.category),
          price: product.price,
          discountPrice: product.discountPrice || '',
          stock: product.stock,
          lowStockThreshold: product.lowStockThreshold,
          status: product.isActive ? 'Active' : 'Inactive',
          stockStatus: this.getStockLabel(product),
          created: new Date(product.createdAt),
        });
      });

      worksheet.getColumn('price').numFmt = '₹#,##0.00';
      worksheet.getColumn('discountPrice').numFmt = '₹#,##0.00';
      worksheet.getColumn('created').numFmt = 'dd/mm/yyyy';

      const buffer = await workbook.xlsx.writeBuffer();
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `products_export_${timestamp}.xlsx`;

      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      saveAs(blob, filename);

      this.messageService.add({
        severity: 'success',
        summary: 'Export Successful',
        detail: `${currentProducts.length} products exported`,
        life: 3000,
      });
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Export Failed',
        detail: error.message,
      });
    }
  }

  /**
   * ✅ SECURITY: Sanitize cell values
   */
  private sanitizeCell(value: string | undefined): string {
    if (!value) return '';
    let sanitized = String(value);
    const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
    if (dangerousChars.some(char => sanitized.startsWith(char))) {
      sanitized = "'" + sanitized;
    }
    return sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  }
}