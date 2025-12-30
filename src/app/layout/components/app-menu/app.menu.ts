import { Component, computed } from '@angular/core';
import { AuthService } from '@/core/services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppMenuitem } from '../app.menuitem';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, RouterModule, AppMenuitem],
    providers: [MessageService],
    templateUrl: './app.menu.component.html'
})
export class AppMenuComponent {
    constructor(
        private authService: AuthService,
        private messageService: MessageService
    ) {}

    model = computed(() => {
        const user = this.authService.currentUser();
        const roleLevel = user?.roleLevel || 0;

        // ✅ Base menu - Available to ALL admin roles
        const dashboardMenu = {
            label: 'Home',
            i18n: '@@menuHome',
            items: [
                {
                    label: 'Dashboard',
                    icon: 'pi pi-home',
                    routerLink: ['/dashboard'],
                    i18n: '@@menuDashboard'
                }
            ]
        };

        // ✅ Executive Management - Available to ALL admin roles (Level 2+)
        const executiveManagement = {
            label: 'Executive Management',
            i18n: '@@menuTeamManagement',
            items: [
                {
                    label: 'View My Executives',
                    icon: 'pi pi-users',
                    routerLink: ['/user-management/executives'],
                    i18n: '@@menuViewMyTeam'
                },
                {
                    label: 'Approval Queue',
                    icon: 'pi pi-check-square',
                    routerLink: ['/tasks/tasks-approve'],
                    i18n: '@@menuApprovalQueue'
                }
            ]
        };

        // ✅ Task Settings - Available to ALL admin roles
        const taskSettings = {
            label: 'Task Settings',
            i18n: '@@menuTaskSettings',
            items: [
                {
                    label: 'Tasks List',
                    icon: 'pi pi-sitemap',
                    routerLink: ['/tasks/tasks-list'],
                    i18n: '@@menuTaskList'
                },
                {
                    label: 'Add Tasks',
                    icon: 'pi pi-sitemap',
                    routerLink: ['/tasks/tasks-add'],
                    i18n: '@@menuAddTask'
                }
            ]
        };

        // ✅ Target Management - Available to ALL admin roles (NEW)
        const targetSettings = {
            label: 'Target Management',
            i18n: '@@menuTargetManagement',
            items: [
                {
                    label: 'Targets List',
                    icon: 'pi pi-chart-line',
                    routerLink: ['/targets/targets-list'],
                    i18n: '@@menuTargetsList'
                },
                {
                    label: 'Add Target',
                    icon: 'pi pi-plus-circle',
                    routerLink: ['/targets/targets-add'],
                    i18n: '@@menuAddTarget'
                },
                {
                    label: 'Dashboard',
                    icon: 'pi pi-chart-bar',
                    routerLink: ['/targets/targets-dashboard'],
                    i18n: '@@menuTargetsDashboard'
                }
            ]
        };

        const locationTrackingMenu =
            roleLevel >= 3
                ? [
                      {
                          label: 'Location Tracking',
                          i18n: '@@menuLocationTracking',
                          items: [
                              {
                                  label: 'Live Map',
                                  icon: 'pi pi-map',
                                  routerLink: ['/location-tracking/live-map'],
                                  i18n: '@@menuLiveMap'
                              },
                              {
                                  label: 'Location History',
                                  icon: 'pi pi-history',
                                  routerLink: ['/location-tracking/list'],
                                  i18n: '@@menuLocationHistory'
                              }
                          ]
                      }
                  ]
                : [];

        // ✅ Base menu for ALL roles
        const baseMenu = [
            dashboardMenu,
            executiveManagement,
            taskSettings,
            targetSettings // ✅ ADDED TARGET MANAGEMENT
        ];

        // 🎯 LOCAL BODY MANAGER+ (Level 4+): Can view admins
        const adminManagementMenu =
            roleLevel >= 4
                ? [
                      {
                          label: 'Admin Management',
                          i18n: '@@menuAdminManagement',
                          items: [
                              {
                                  label: 'View Admins',
                                  icon: 'pi pi-sitemap',
                                  routerLink: ['/user-management/admins'],
                                  i18n: '@@menuManageAdmins'
                              }
                          ]
                      }
                  ]
                : [];

        // 🎯 DISTRICT MANAGER+ (Level 6+): Training Module
        const trainingMenu =
            roleLevel >= 6
                ? [
                      {
                          label: 'Training Module',
                          i18n: '@@menuTrainingModule',
                          items: [
                              {
                                  label: 'Manage Content',
                                  icon: 'pi pi-video',
                                  routerLink: ['/training/content'],
                                  i18n: '@@menuManageContent'
                              },
                              {
                                  label: 'Quiz Manager',
                                  icon: 'pi pi-question-circle',
                                  routerLink: ['/training/quiz'],
                                  i18n: '@@menuQuizManager'
                              },
                              {
                                  label: 'View Progress',
                                  icon: 'pi pi-chart-bar',
                                  routerLink: ['/training/progress'],
                                  i18n: '@@menuViewProgress'
                              },
                              {
                                  label: 'PDF Template',
                                  icon: 'pi pi-dollar',
                                  routerLink: [
                                      '/settings/certificate-templates'
                                  ],
                                  i18n: '@@menuPdfTemplates'
                              }
                          ]
                      }
                  ]
                : [];

        // 🎯 STATE HEAD+ (Level 10+): HR & Recruitment
        const hrMenu =
            roleLevel >= 10
                ? [
                      {
                          label: 'HR & Recruitment',
                          i18n: '@@menuHrRecruitment',
                          items: [
                              {
                                  label: 'Candidate Pipeline',
                                  icon: 'pi pi-users',
                                  routerLink: ['/recruitment/pipeline'],
                                  i18n: '@@menuCandidatePipeline'
                              },
                              {
                                  label: 'Manage Jobs',
                                  icon: 'pi pi-book',
                                  routerLink: ['/recruitment/jobs'],
                                  i18n: '@@menuManageJobs'
                              }
                          ]
                      }
                  ]
                : [];

        // 🎯 SUPER ADMIN ONLY (Level 12): Store Management
        const storeMenu =
            roleLevel === 12
                ? [
                      {
                          label: 'Store Management',
                          i18n: '@@menuStoreManagement',
                          items: [
                              {
                                  label: 'Manage Products',
                                  icon: 'pi pi-tags',
                                  routerLink: ['/store/products'],
                                  i18n: '@@menuManageProducts'
                              },
                              {
                                  label: 'View Orders',
                                  icon: 'pi pi-inbox',
                                  routerLink: ['/store/orders'],
                                  i18n: '@@menuViewOrders'
                              }
                          ]
                      }
                  ]
                : [];

        // ✅ Build final menu based on role level
        return [
            ...baseMenu, // ALL roles (Level 2+) - NOW INCLUDES TARGET MANAGEMENT
            ...adminManagementMenu, // Level 4+ (Local Body Manager+)
            ...locationTrackingMenu,
            ...trainingMenu, // Level 6+ (District Manager+)
            ...hrMenu, // Level 10+ (State Head+)
            ...storeMenu // Level 12 only (Super Admin)
        ];
    });
}