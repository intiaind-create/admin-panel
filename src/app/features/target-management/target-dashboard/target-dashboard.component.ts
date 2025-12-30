// src/app/features/target-management/target-dashboard/target-dashboard.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';

import { TargetPeriod, TargetStats } from '../models/target.types';
import { TargetService } from '../service/target.service';

@Component({
    selector: 'app-target-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        CardModule,
        ProgressBarModule,
        SelectModule,
        FormsModule
    ],
    templateUrl: './target-dashboard.component.html',
    styleUrls: ['./target-dashboard.component.scss']
})
export class TargetDashboardComponent implements OnInit {
    stats: TargetStats | null = null;
    isLoading = true;
    selectedPeriod: TargetPeriod | null = null;
    selectedDaysBack: number = 90;

    periodOptions: { label: string; value: TargetPeriod | null }[] = [
        { label: 'All Periods', value: null },
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Quarterly', value: 'quarterly' }
    ];

    daysBackOptions: { label: string; value: number }[] = [
        { label: 'Last 30 Days', value: 30 },
        { label: 'Last 90 Days', value: 90 },
        { label: 'Last 6 Months', value: 180 },
        { label: 'Last Year', value: 365 }
    ];

    targetService = inject(TargetService);

    async ngOnInit() {
        await this.loadStats();
    }

    async loadStats() {
        try {
            this.isLoading = true;
            this.stats = await this.targetService.getTargetStats(
                this.selectedPeriod || undefined,
                this.selectedDaysBack
            );
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            this.isLoading = false;
        }
    }

    onFilterChange() {
        this.loadStats();
    }

    formatCurrency(amount: number): string {
        return this.targetService.formatCurrency(amount);
    }
}