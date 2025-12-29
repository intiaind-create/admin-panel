// src/app/core/guards/auth.guard.ts

import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const AuthGuard: CanActivateFn = async (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    console.log('🛡️ AuthGuard checking...', state.url);

    // ✅ ADD THIS: Wait for profile loading to finish
    let waitCount = 0;
    while (authService.isLoadingProfile() && waitCount < 50) {
        // Max 2.5 seconds
        console.log('⏳ Waiting for profile to load...');
        await new Promise((resolve) => setTimeout(resolve, 50));
        waitCount++;
    }

    console.log('👤 Current user:', authService.currentUser());
    console.log('✅ Is logged in?', authService.isLoggedIn());

    if (!authService.isLoggedIn()) {
        console.log('❌ Not logged in, redirecting to /auth/login');
        router.navigate(['/auth/login']);
        return false;
    }

    console.log('✅ Auth guard passed');
    return true;
};
