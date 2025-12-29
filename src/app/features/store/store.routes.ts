import { Routes } from "@angular/router";
import { ProductManagementComponent } from "./product-management/product-management.component";
import { ViewOrdersComponent } from "./view-orders/view-orders.component";

export const STORE_ROUTES: Routes = [
    {path: 'products', component: ProductManagementComponent, title: 'Product Management'},
   { path: 'orders', component: ViewOrdersComponent, title: 'View Orders'}
]
