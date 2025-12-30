import { Routes } from '@angular/router';
import { AuthGuard } from '@/core/guards/auth.guard';
import { LayoutComponent } from '@/layout/components/layout/layout.component';
import { NotFoundComponent } from '@/shared/notfound/notfound.component';

export const appRoutes: Routes = [
    // 1. Auth routes are separate and unprotected
    {
        path: 'auth',
        loadChildren: () =>
            import('@/core/auth/auth.routes').then((m) => m.AUTH_ROUTES)
    },
    {
        path: 'apply',
        loadComponent: () =>
            import(
                '@/features/hr-recruitment/public/component/public-application-form.component'
            ).then((m) => m.PublicApplicationFormComponent)
    },

    // 2. The main application layout, protected by the AuthGuard
    {
        path: '', // The root path is now the main app
        component: LayoutComponent,
        canActivate: [AuthGuard],
        children: [
            // Default child route is the dashboard
            {
                path: 'dashboard',
                loadComponent: () =>
                    import(
                        '@/features/dashboard/component/dashboard-component'
                    ).then((c) => c.DashboardComponent)
            },

            {
                path: 'user-management',
                loadChildren: () =>
                    import(
                        '@/features/user-management/user.management.route'
                    ).then((m) => m.USER_MANAGEMENT_ROUTES)
            },
            {
                path: 'tasks',
                loadChildren: () =>
                    import(
                        '@/features/task-management/task-management.route'
                    ).then((m) => m.TASK_MANAGEMENT_ROUTE)
            },
            {
                path: 'targets',
                loadChildren: () =>
                    import(
                        '@/features/target-management/target-management.route'
                    ).then((m) => m.TARGET_MANAGEMENT_ROUTE)
            },
            {
                path: 'location-tracking',
                loadChildren: () =>
                    import(
                        '@/features/location-tracking/location-tracking.routes'
                    ).then((m) => m.LOCATION_TRACKING_ROUTES)
            },
            {
                path: 'recruitment',
                loadChildren: () =>
                    import(
                        '@/features/hr-recruitment/hr-recruitment.routes'
                    ).then((m) => m.RECRUITMENT_ROUTES)
            },
            {
                path: 'store',
                loadChildren: () =>
                    import('@/features/store/store.routes').then(
                        (m) => m.STORE_ROUTES
                    )
            },
            {
                path: 'training',
                loadChildren: () =>
                    import('@/features/training/training.routes').then(
                        (m) => m.TRAINING_ROUTES
                    )
            },
            {
                path: 'settings',
                loadChildren: () =>
                    import('@/features/settings/settings.routes').then(
                        (m) => m.SETTINGS_ROUTES
                    )
            },

            // Redirect from the empty path '' to the dashboard
            { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
        ]
    },

    // 3. Not Found and wildcard routes
    { path: 'notfound', component: NotFoundComponent },
    { path: '**', component: NotFoundComponent }
];