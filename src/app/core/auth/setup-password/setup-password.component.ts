import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { api } from 'convex/_generated/api';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { ConvexService } from '../../services/convex.service';

@Component({
  selector: 'app-setup-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    PasswordModule,
    MessageModule
  ],
  templateUrl:'./setup-password.component.html',
  styleUrls:['./setup-password.component.scss']
})
export class SetupPasswordComponent implements OnInit {
  token: string = '';
  password: string = '';
  confirmPassword: string = '';
  error: string = '';
  loading: boolean = false;
  success: boolean = false;
   title: string = 'Setup Your Password';
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private convex: ConvexService
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParams['token'] || '';
    if (!this.token) {
      this.error = 'Invalid or missing token';
      return;
    }
    const isResetFlow = this.router.url.includes('reset-password');
    this.title = isResetFlow ? 'Reset Your Password' : 'Setup Your Password';
  }
async setupPassword() {
  this.password = this.password.trim();
  this.confirmPassword = this.confirmPassword.trim();

  if (this.password !== this.confirmPassword) {
    this.error = 'Passwords do not match';
    return;
  }
  
  if (this.password.length < 8) {
    this.error = 'Password must be at least 8 characters';
    return;
  }

  this.loading = true;
  this.error = '';

  try {
    let result;

    // ✅ ONE COMPONENT, TWO FLOWS
    const isResetFlow = this.router.url.includes('reset-password');
    
    if (isResetFlow) {
      // Existing user password reset
      result = await this.convex.client.action(api.auth.consumeResetToken as any, {
        token: this.token,
        password: this.password
      });
    } else {
      // New user setup
      result = await this.convex.client.action(api.auth.setupPasswordWithToken as any, {
        token: this.token,
        password: this.password
      });
    }

    console.log('Password setup successful', result);
    this.success = true;
    
    // Redirect to login/dashboard
    setTimeout(() => this.router.navigate(['/auth/login']), 2000);
    
  } catch (err: any) {
    console.error('Password setup failed', err);
    this.error = err.message || 'Failed to setup password. Token may be invalid or expired.';
  } finally {
    this.loading = false;
  }
}



}
