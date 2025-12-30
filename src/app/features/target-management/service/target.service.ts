// src/app/features/target-management/services/target.service.ts

import { Injectable } from '@angular/core';
import { ConvexService } from '@/core/services/convex.service';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { TargetPeriod, TargetStatus, CreateTargetData, UpdateTargetData } from '../models/target.types';



@Injectable({
    providedIn: 'root'
})
export class TargetService {
    private get convex() {
        return this.convexService.client;
    }

    constructor(private convexService: ConvexService) {}

    // ============================================================================
    // ADMIN TARGET QUERIES
    // ============================================================================
    listTargets(
        paginationOpts: { numItems: number; cursor: string | null },
        filters?: {
            executiveId?: Id<'executives'>;
            period?: TargetPeriod;
            status?: TargetStatus;
        }
    ) {
        return this.convex.query(api.targets.admin.queries.listTargets, {
            paginationOpts,
            ...filters
        });
    }

    getTarget(targetId: Id<'targets'>) {
        return this.convex.query(api.targets.admin.queries.getTarget, { targetId });
    }

    getTargetStats(period?: TargetPeriod, daysBack?: number) {
        return this.convex.query(api.targets.admin.queries.getTargetStats, {
            period,
            daysBack
        });
    }

    getExecutiveTargetHistory(executiveId: Id<'executives'>, limit?: number) {
        return this.convex.query(api.targets.admin.queries.getExecutiveTargetHistory, {
            executiveId,
            limit
        });
    }

    // ============================================================================
    // ADMIN TARGET MUTATIONS
    // ============================================================================
    createTarget(targetData: CreateTargetData) {
        return this.convex.mutation(
            api.targets.admin.mutation.createTarget,
            targetData
        );
    }

    updateTarget(targetId: Id<'targets'>, updates: UpdateTargetData) {
        return this.convex.mutation(api.targets.admin.mutation.updateTarget, {
            targetId,
            ...updates
        });
    }

    deleteTarget(targetId: Id<'targets'>) {
        return this.convex.mutation(api.targets.admin.mutation.deleteTarget, {
            targetId
        });
    }

    bulkCreateTargets(data: {
        executiveIds: Id<'executives'>[];
        period: TargetPeriod;
        startDate: number;
        endDate: number;
        sponsorshipTarget: number;
        tasksTarget: number;
        votersTarget: number;
    }) {
        return this.convex.mutation(
            api.targets.admin.mutation.bulkCreateTargets,
            data
        );
    }

    recordSponsorship(data: {
        executiveId: Id<'executives'>;
        amount: number;
        source: string;
        collectedAt?: number;
    }) {
        return this.convex.mutation(
            api.targets.admin.mutation.recordSponsorship,
            data
        );
    }

    // ============================================================================
    // UTILITY METHODS
    // ============================================================================
    getPeriodLabel(period: TargetPeriod): string {
        const labels: Record<TargetPeriod, string> = {
            daily: 'Daily',
            weekly: 'Weekly',
            monthly: 'Monthly',
            quarterly: 'Quarterly'
        };
        return labels[period];
    }

    getStatusColor(status: TargetStatus): string {
        const colors: Record<TargetStatus, string> = {
            active: '#42A5F5',
            completed: '#66BB6A',
            failed: '#EF5350',
            cancelled: '#9E9E9E'
        };
        return colors[status] || '#757575';
    }

    getStatusSeverity(
        status: TargetStatus
    ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        switch (status) {
            case 'active':
                return 'info';
            case 'completed':
                return 'success';
            case 'failed':
                return 'danger';
            case 'cancelled':
                return 'secondary';
            default:
                return 'info';
        }
    }

    getProgressColor(progress: number): string {
        if (progress >= 80) return '#66BB6A'; // Green
        if (progress >= 50) return '#FFA726'; // Orange
        return '#EF5350'; // Red
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    }

    formatDateRange(startDate: number, endDate: number): string {
        const start = new Date(startDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short'
        });
        const end = new Date(endDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        return `${start} - ${end}`;
    }

    calculateDaysRemaining(endDate: number): number {
        const now = Date.now();
        const diff = endDate - now;
        return Math.ceil(diff / (24 * 60 * 60 * 1000));
    }

    isOnTrack(
        progress: number,
        startDate: number,
        endDate: number
    ): boolean {
        const now = Date.now();
        const totalDuration = endDate - startDate;
        const timeElapsed = now - startDate;
        const expectedProgress = (timeElapsed / totalDuration) * 100;
        return progress >= expectedProgress;
    }
}