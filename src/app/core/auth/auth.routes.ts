import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { SetupPasswordComponent } from './setup-password/setup-password.component';

export const AUTH_ROUTES: Routes = [
  { path: 'login', component: LoginComponent },
  // { path: 'forgotpassword', component: ForgotPasswordComponent },
{
    path: 'setup-password',  // ✅ ADD THIS
    component: SetupPasswordComponent
  },
{path:'reset-password',
  component:SetupPasswordComponent
}];
