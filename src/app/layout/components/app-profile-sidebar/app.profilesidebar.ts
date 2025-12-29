import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { LayoutService } from '@/layout/service/layout.service';
import { AuthService } from '@/core/services/auth.service'; 

@Component({
    selector: '[app-profilesidebar]',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        DrawerModule,
    ],
    templateUrl: 'app.profilesidebar.component.html',
})
export class AppProfileSidebar {
    layoutService = inject(LayoutService);
    authService = inject(AuthService);

    // ✅ Computed signals from AuthService - automatically reactive!
    userName = computed(() => this.authService.currentUser()?.name || 'User');
    userEmail = computed(() => this.authService.currentUser()?.email || '');
    userRole = computed(() => this.authService.currentUser()?.roleName || '');
    
    visible = computed(
        () => this.layoutService.layoutState().profileSidebarVisible,
    );

    onDrawerHide() {
        this.layoutService.hideProfileSidebar();
    }

    signOut() {
        this.authService.logout();
    }
}