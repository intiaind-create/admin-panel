// src/app/features/target-management/target-management.route.ts

import { Routes } from "@angular/router";
import { TargetFormComponent } from "./target-form/target-form.component";
import { TargetListComponent } from "./target-list/target-list.component";
import { TargetDashboardComponent } from "./target-dashboard/target-dashboard.component";

export const TARGET_MANAGEMENT_ROUTE: Routes = [
    { path: 'targets-add', component: TargetFormComponent },
    { path: 'targets-edit/:id', component: TargetFormComponent },
    { path: 'targets-list', component: TargetListComponent },
    {path:'targets-dashboard',component:TargetDashboardComponent},
    { path: '', redirectTo: 'targets-list', pathMatch: 'full' }
];