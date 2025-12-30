// src/app/features/target-management/target-list/target-list.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AutoCompleteModule } from 'primeng/autocomplete';

import { UserService } from '@/features/user-management/user.service';
import { EnrichedTarget, TargetPeriod, TargetStatus, Executive } from '../models/target.types';
import { Id } from 'convex/_generated/dataModel';
import { TargetService } from '../service/target.service';

@Component({
    selector: 'app-target-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        SelectModule,
        TagModule,
        ProgressBarModule,
        ConfirmDialogModule,
        ToastModule,
        AutoCompleteModule
    ],
    providers: [ConfirmationService, MessageService],
    templateUrl: './target-list.component.html',
    styleUrls: ['./target-list.component.scss']
})
export class TargetListComponent implements OnInit {
    targets: EnrichedTarget[] = [];
    isLoading = true;
    cursor: string | null = null;
    hasMore = false;

    // Filters
    selectedExecutive: Executive | null = null;
    selectedExecutiveName: string = '';
    selectedPeriod: TargetPeriod | null = null;
    selectedStatus: TargetStatus | null = null;

    allExecutives: Executive[] = [];
    filteredExecutives: Executive[] = [];

    periodOptions: { label: string; value: TargetPeriod | null }[] = [
        { label: 'All Periods', value: null },
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Quarterly', value: 'quarterly' }
    ];

    statusOptions: { label: string; value: TargetStatus | null }[] = [
        { label: 'All Status', value: null },
        { label: 'Active', value: 'active' },
        { label: 'Completed', value: 'completed' },
        { label: 'Failed', value: 'failed' },
        { label: 'Cancelled', value: 'cancelled' }
    ];

    router = inject(Router);
    targetService = inject(TargetService);
    userService = inject(UserService);
    confirmationService = inject(ConfirmationService);
    messageService = inject(MessageService);

    async ngOnInit() {
        await this.loadExecutives();
        await this.loadTargets();
    }

    async loadExecutives() {
        try {
            const result = await this.userService.getExecutives(
                { numItems: 100, cursor: null },
                { isActive: true }
            );

            this.allExecutives = result.page.map((exec: any) => ({
                _id: exec._id,
                name: exec.name,
                email: exec.email,
                employeeId: exec.employeeId,
                wardId: exec.wardId,
                wardName: exec.wardName,
                zone: exec.zone,
                district: exec.district,
                hierarchyId: exec.hierarchyId
            }));
        } catch (error) {
            console.error('Failed to load executives:', error);
        }
    }

    async loadTargets(append: boolean = false) {
        try {
            this.isLoading = true;

            const filters: any = {};
            if (this.selectedExecutive) {
                filters.executiveId = this.selectedExecutive._id;
            }
            if (this.selectedPeriod) {
                filters.period = this.selectedPeriod;
            }
            if (this.selectedStatus) {
                filters.status = this.selectedStatus;
            }

            const result = await this.targetService.listTargets(
                { numItems: 20, cursor: append ? this.cursor : null },
                filters
            );

            if (append) {
                this.targets = [...this.targets, ...result.page];
            } else {
                this.targets = result.page;
            }

            this.cursor = result.continueCursor;
            this.hasMore = result.isDone === false;
        } catch (error) {
            console.error('Failed to load targets:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to load targets',
                life: 3000
            });
        } finally {
            this.isLoading = false;
        }
    }

    filterExecutives(event: any) {
        const query = event.query.toLowerCase();
        this.filteredExecutives = this.allExecutives.filter(
            (exec) =>
                exec.name.toLowerCase().includes(query) ||
                exec.employeeId.toLowerCase().includes(query)
        );
    }

    onExecutiveSelect(event: any) {
        const executive = event?.value ?? event;
        if (executive) {
            this.selectedExecutive = executive;
            this.selectedExecutiveName = executive.name;
            this.applyFilters();
        }
    }

    clearExecutiveFilter() {
        this.selectedExecutive = null;
        this.selectedExecutiveName = '';
        this.applyFilters();
    }

    applyFilters() {
        this.cursor = null;
        this.loadTargets(false);
    }

    loadMore() {
        if (this.hasMore && !this.isLoading) {
            this.loadTargets(true);
        }
    }

    createTarget() {
        this.router.navigate(['/targets/targets-add']);
    }

    editTarget(target: EnrichedTarget) {
        this.router.navigate(['/targets/targets-edit', target._id]);
    }

    deleteTarget(target: EnrichedTarget) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete target for ${target.executiveName}?`,
            header: 'Delete Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
                try {
                    await this.targetService.deleteTarget(target._id);
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Target deleted successfully',
                        life: 3000
                    });
                    await this.loadTargets();
                } catch (error: any) {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: error?.message || 'Failed to delete target',
                        life: 3000
                    });
                }
            }
        });
    }

    getProgressColor(progress: number): string {
        return this.targetService.getProgressColor(progress);
    }

    getStatusSeverity(
        status: TargetStatus
    ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        return this.targetService.getStatusSeverity(status);
    }

    formatCurrency(amount: number): string {
        return this.targetService.formatCurrency(amount);
    }

    formatDateRange(startDate: number, endDate: number): string {
        return this.targetService.formatDateRange(startDate, endDate);
    }
}