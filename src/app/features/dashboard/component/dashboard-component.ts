import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecentSubmissionsWidgetComponent } from '../recent-status/recent-submissions-widget.component.ts';
import { StatusWidgetComponent } from '../status-widgets/statuswidget';
import { TopExecutivesWidgetComponent } from '../top-perfomers/top-executives-widget.ts';
import { DashboardService } from '../dashboard.service';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ChartModule } from "primeng/chart";
import { ToastModule } from "primeng/toast";
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RecentSubmissionsWidgetComponent,
    StatusWidgetComponent,
    TopExecutivesWidgetComponent,
    CardModule,
    ProgressSpinnerModule,
    ChartModule,
    ToastModule
],
providers: [MessageService],
  templateUrl: './dashboard-component.html'
})
export class DashboardComponent implements OnInit {
  // Stats from your seeded database
  dashboardStats: any = null;
  loading = true;
  error: string = '';
@ViewChild('dashboardContainer') dashboardContainer!: ElementRef;
  constructor(private dashboardService: DashboardService,messageService: MessageService) {}

  async ngOnInit() {
    await this.loadDashboardStats();
  }

  async loadDashboardStats() {
    try {
      console.log('📊 Loading dashboard stats...');
      // this.dashboardStats = await this.dashboardService.getAdminDashboardSummary();
      console.log('✅ Dashboard stats loaded:', this.dashboardStats);
      this.loading = false;
    } catch (error: any) {
      console.error('❌ Failed to load dashboard stats:', error);
      this.error = error.message || 'Failed to load dashboard';
      this.loading = false;
    }
  }
}
