// src/app/core/services/auth.service.ts

import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { api } from 'convex/_generated/api';
import { ConvexService } from './convex.service';
import { ConvexClient } from 'convex/browser';


export type UserProfile = {
    authUserId: string;
    authEmail: string | undefined;
    adminUserId: string;
    name: string;
    email: string;
    phone: string | undefined;
    roleLevel: number;
    roleName: string;
    rootId: string;
    hierarchyId?: string;
    hierarchyName: string;
    hierarchyPath: string;
    hierarchyLevel: number;
    managerId: string | undefined;
    managerName: string | null;
    isActive: boolean;
    lastLogin: number | undefined;
    createdAt: number;
};


@Injectable({ providedIn: 'root' })
export class AuthService {
    public convex: ConvexClient;
    private router = inject(Router);

    public currentUser = signal<UserProfile | null>(null);
    // ✅ ADD THIS LINE
    public isLoadingProfile = signal<boolean>(false);

    constructor(convexService: ConvexService) {
        this.convex = convexService.client;

        const token = localStorage.getItem('convex_session_token');
        if (token) {
            console.log('🔑 Found existing token, restoring auth...');
            this.convex.setAuth(async () => token);

            // ✅ CHANGE THIS: Set loading state
            this.isLoadingProfile.set(true);
            this.loadProfile()
                .catch((err) => {
                    console.error('Failed to restore session:', err);
                    localStorage.removeItem('convex_session_token');
                    this.convex.setAuth(async () => null);
                })
                .finally(() => {
                    // ✅ ADD THIS: Clear loading state when done
                    this.isLoadingProfile.set(false);
                });
        }
    }
// Frontend: auth.service.ts

async login(email: string, password: string): Promise<void> {
    try {
        const ipAddress = undefined;
        const userAgent = navigator.userAgent;

        // STEP 1: Security pre-check (rate limiting, account status)
        console.log('🔐 Security check...');
        const preCheck: any = await this.convex.action(
            api.secureAuth.actions.preLoginCheck,
            { email, ipAddress, userAgent }
        );

        if (!preCheck.allowed) {
            throw new Error(preCheck.reason || 'Login not allowed');
        }

        console.log('✅ Security passed');

        // STEP 2: Convex Auth password verification
        console.log('🔑 Verifying credentials...');
        let result: any;
        try {
            result = await this.convex.action(api.auth.signIn, {
                provider: 'password',
                params: { flow: 'signIn', email, password },
            });
        } catch (error: any) {
            // Password wrong - record failed attempt
            await this.convex.action(api.secureAuth.actions.recordFailedLogin, {
                email,
                adminUserId: preCheck.adminUserId,
                reason: 'Invalid password',
                ipAddress,
                userAgent,
            });
            throw new Error('Invalid email or password');
        }

        // STEP 3: Password correct - record success
        console.log('✅ Credentials valid');
        await this.convex.action(api.secureAuth.actions.recordSuccessfulLogin, {
            email,
            adminUserId: preCheck.adminUserId,
            ipAddress,
            userAgent,
        });

        // Save token and load profile
        if (result?.tokens) {
            const token = result.tokens.token;
            localStorage.setItem('convex_session_token', token);
            this.convex.setAuth(async () => token);
            await this.loadProfile();
            console.log('✅ Login complete!');
        }
    } catch (error: any) {
        console.error('❌ Login failed:', error);
        localStorage.removeItem('convex_session_token');
        this.convex.setAuth(async () => null);
        this.currentUser.set(null);
        throw error;
    }
}


    isLoggedIn(): boolean {
        return !!this.currentUser();
    }

    async loadProfile() {
        console.log('🔄 loadProfile called');
        try {
            const token = localStorage.getItem('convex_session_token');
            if (!token) {
                console.log('❌ No token found');
                throw new Error('No token');
            }

            console.log('📞 Fetching profile from Convex...');
            const profile = await this.convex.query(
                api.auth.getCurrentUserProfile,
                {}
            );

            console.log('✅ Profile fetched:', profile);
            this.currentUser.set(profile);
        } catch (e: any) {
            console.error('❌ loadProfile error:', e);
            this.currentUser.set(null);
            localStorage.removeItem('convex_session_token');
            throw e;
        }
    }

 async logout(): Promise<void> {
        try {
            const sessionToken = localStorage.getItem('convex_session_token');
            const ipAddress = undefined;
            const userAgent = navigator.userAgent;

            const currentUser = this.currentUser();

            // Call secure logout action - it handles:
            // - Audit logging
            // - Session termination
            if (currentUser) {
                await this.convex.action(api.secureAuth.actions.secureSignOut, {
                    userId: currentUser.authUserId,
                    sessionToken: sessionToken || undefined,
                    ipAddress,
                    userAgent,
                });
            }

            // Standard Convex Auth signOut
            await this.convex.action(api.auth.signOut, {});
        } catch (error) {
            console.error('Logout action failed:', error);
        }

        localStorage.removeItem('convex_session_token');
        this.convex.setAuth(async () => null);
        this.currentUser.set(null);
        this.router.navigate(['/auth/login']);
    }
    isSuperAdmin(): boolean {
        return this.currentUser()?.roleLevel === 12;
    }

    hasMinimumRole(minLevel: number): boolean {
        const roleLevel = this.currentUser()?.roleLevel;
        return roleLevel !== undefined && roleLevel >= minLevel;
    }

    static readonly ROLE_LEVELS = {
        FIELD_EXECUTIVE: 1,
        BLOCK_COORDINATOR: 4,
        WARD_COORDINATOR: 5,
        DISTRICT_MANAGER: 6,
        DISTRICT_HEAD: 7,
        ZONAL_MANAGER: 8,
        ZONAL_HEAD: 9,
        STATE_MANAGER: 10,
        STATE_HEAD: 11,
        SUPER_ADMIN: 12
    } as const;

    can(permission: string): boolean {
        const user = this.currentUser();
        if (!user) return false;

        const roleLevel = user.roleLevel;

        const permissions: Record<string, boolean> = {
            canManageUsers: roleLevel >= 12,
            canManageTasks: roleLevel >= 4,
            canApprove: roleLevel >= 6,
            canManageOrders: roleLevel >= 8,
            canManageTraining: roleLevel >= 6,
            canManageHR: roleLevel >= 10,
            canViewAnalytics: roleLevel >= 6,
            isSuperAdmin: roleLevel === 12
        };

        return permissions[permission] || false;
    }
}
