import { Routes } from '@angular/router';
import { AdminListComponent } from './components/admins/admin-list/admin-list.component';
import { ExecutiveFormComponent } from './components/executives/executive-form/executive-form.component';
import { ExecutiveListComponent } from './components/executives/executive-list/executive-list.component';
import { AdminRbacFormComponent } from './components/admins/admin-form/admin-rbac-form.component';

export const USER_MANAGEMENT_ROUTES: Routes = [
  { path: 'admins', component: AdminListComponent },
  { path: 'admins/create', component: AdminRbacFormComponent },
  { path: 'admins/edit/:id', component: AdminRbacFormComponent },
  { path: 'executives', component: ExecutiveListComponent },
  { path: 'executives/create', component: ExecutiveFormComponent },
  { path: 'executives/edit/:id', component: ExecutiveFormComponent },
  { path: '', redirectTo: 'admins', pathMatch: 'full' }
];