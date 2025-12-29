// src/app/core/auth/login/login.ts

import {
    Component,
    computed,
    effect,
    inject,
    Injector,
    OnInit,
    runInInjectionContext
} from '@angular/core';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import {
    FormBuilder,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LayoutService } from '@/layout/service/layout.service';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '@/core/services/auth.service';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { api } from 'convex/_generated/api';
import { DialogModule } from 'primeng/dialog';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        CheckboxModule,
        InputTextModule,
        IconFieldModule,
        InputIconModule,
        ButtonModule,
        ToastModule,
        FormsModule,
        DialogModule
    ],
    providers: [MessageService, DialogService],
    templateUrl: './app-login.html',
    styleUrls: ['./app-login.scss']
})
export class LoginComponent implements OnInit {
    private dialogRef!: DynamicDialogRef;
    showForgotPasswordDialog = false;
    forgotLoading = false;
forgotEmail = '';
    isLoading: boolean = false;
    loginForm!: FormGroup;

    layoutService = inject(LayoutService);
    authService = inject(AuthService);
    router = inject(Router);
    fb = inject(FormBuilder);
    injector = inject(Injector);
    messageService = inject(MessageService);
    dialogService = inject(DialogService);
    passwordVisible = false;

    ngOnInit() {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required],
            rememberMe: [false]
        });

        if (this.authService.isLoggedIn()) {
            this.router.navigate(['/']);
            return;
        }

        runInInjectionContext(this.injector, () => {
            const emailChanges = toSignal(
                this.loginForm.get('email')!.valueChanges
            );
            const passwordChanges = toSignal(
                this.loginForm.get('password')!.valueChanges
            );

            effect(() => {
                emailChanges();
                const emailControl = this.loginForm.get('email');
                if (emailControl?.hasError('serverError')) {
                    emailControl.setErrors(null);
                }
            });

            effect(() => {
                passwordChanges();
                const passwordControl = this.loginForm.get('password');
                if (passwordControl?.hasError('serverError')) {
                    passwordControl.setErrors(null);
                }
            });
        });
    }

    // src/app/core/auth/login/login.ts

    async handleLogin() {
        console.log('🔵 Login button clicked');

        if (this.loginForm.invalid) {
            console.log('❌ Form is invalid');
            this.loginForm.markAllAsTouched();
            return;
        }

        console.log('✅ Form is valid, attempting login...');
        this.isLoading = true;

        try {
            console.log('🚀 Calling authService.login().. .');

            // This will now throw error if profile loading fails
            await this.authService.login(
                this.loginForm.value.email,
                this.loginForm.value.password
            );

            console.log('✅ Login successful!');
            console.log('👤 User:', this.authService.currentUser());

            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Login successful! Redirecting...',
                life: 2000
            });

            // ✅ Navigate now that user is loaded
            console.log('🎯 Navigating to /dashboard...');
            setTimeout(() => {
                this.router.navigate(['/dashboard']);
            }, 500);
        } catch (error: any) {
            console.error('❌ Login error:', error);

            if (
                error?.message?.includes('USER_NOT_FOUND') ||
                error?.message?.includes('user not found')
            ) {
                this.loginForm.get('email')?.setErrors({
                    serverError: 'No account found with that email.'
                });
            } else if (
                error?.message?.includes('INCORRECT_PASSWORD') ||
                error?.message?.includes('incorrect password')
            ) {
                this.loginForm.get('password')?.setErrors({
                    serverError: 'The password you entered is incorrect.'
                });
            } else {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Login Failed',
                    detail: error?.message || 'An unexpected error occurred.',
                    life: 5000
                });
            }
        } finally {
            console.log('🏁 Login attempt finished');
            this.isLoading = false;
        }
    }

  async onForgotPassword() {
    this.showForgotPasswordDialog = true;
  }
async submitForgotPassword() {
  if (!this.forgotEmail || !this.forgotEmail.includes('@')) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Invalid Email',
      detail: 'Please enter valid email'
    });
    return;
  }

  this.forgotLoading = true;
  try {
    console.log('🔵 Frontend: Starting forgot password for:', this.forgotEmail);
    
    const result = await this.authService.convex.action(api.auth.requestPasswordReset, {
      email: this.forgotEmail
    });

    console.log('🟢 Frontend: Action returned:', result);

    this.messageService.add({
      severity: 'success',
      summary: 'Reset Link Sent',
      detail: 'Check inbox/spam.',
      life: 5000
    });

    this.forgotEmail = '';
    this.showForgotPasswordDialog = false;
  } catch (error: any) {
    console.error('🔴 Frontend: Error caught:', error);
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message
    });
  } finally {
    this.forgotLoading = false;
  }
}

}

