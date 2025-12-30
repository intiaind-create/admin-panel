// src/app/features/target-management/target-form/target-form.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { InputNumberModule } from 'primeng/inputnumber';

import { UserService } from '@/features/user-management/user.service';
import {
    CreateTargetData,
    UpdateTargetData,
    TargetPeriod,
    Executive
} from '../models/target.types';
import { Id } from 'convex/_generated/dataModel';
import { TargetService } from '../service/target.service';

@Component({
    selector: 'app-target-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ButtonModule,
        InputTextModule,
        InputNumberModule,
        SelectModule,
        DatePickerModule,
        AutoCompleteModule,
        ToastModule,
        FormsModule
    ],
    providers: [MessageService],
    templateUrl: './target-form.component.html',
    styleUrls: ['./target-form.component.scss']
})
export class TargetFormComponent implements OnInit {
    targetForm!: FormGroup;
    isEditMode = false;
    currentTargetId: Id<'targets'> | null = null;
    isLoading = true;
    minStartDate = new Date();
    minEndDate = new Date();

    allExecutives: Executive[] = [];
    filteredExecutives: Executive[] = [];
    selectedExecutive: Executive | null = null;
    selectedExecutiveName: string = '';

    targetPeriods: { label: string; value: TargetPeriod }[] = [
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Quarterly', value: 'quarterly' }
    ];

    fb = inject(FormBuilder);
    router = inject(Router);
    route = inject(ActivatedRoute);
    targetService = inject(TargetService);
    userService = inject(UserService);
    messageService = inject(MessageService);

    constructor() {
        this.targetForm = this.fb.group({
            executiveId: [null, Validators.required],
            period: ['monthly' as TargetPeriod, Validators.required],
            startDate: [null, Validators.required],
            endDate: [null, Validators.required],
            sponsorshipTarget: [0, [Validators.required, Validators.min(0)]],
            tasksTarget: [0, [Validators.required, Validators.min(0)]],
            votersTarget: [0, [Validators.required, Validators.min(0)]]
        });

        // Update minEndDate when startDate changes
        this.targetForm.get('startDate')?.valueChanges.subscribe((date) => {
            if (date) {
                this.minEndDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
            }
        });
    }

    async ngOnInit() {
        await this.loadExecutives();

        const targetId = this.route.snapshot.paramMap.get('id');
        if (targetId) {
            this.currentTargetId = targetId as Id<'targets'>;
            this.isEditMode = true;
            await this.loadTarget(this.currentTargetId);
        }
        this.isLoading = false;
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

            console.log('✅ Loaded executives:', this.allExecutives.length);
        } catch (error) {
            console.error('Failed to load executives:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to load executives',
                life: 3000
            });
        }
    }

    async loadTarget(targetId: Id<'targets'>) {
        try {
            const target = await this.targetService.getTarget(targetId);
            console.log('✅ Loaded target for editing:', target);

            this.selectedExecutiveName = target.executiveName || '';
            this.selectedExecutive =
                this.allExecutives.find((e) => e._id === target.executiveId) ||
                null;

            if (this.selectedExecutive) {
                this.selectedExecutiveName = this.selectedExecutive.name;
            }

            this.targetForm.patchValue({
                executiveId: target.executiveId,
                period: target.period,
                startDate: new Date(target.startDate),
                endDate: new Date(target.endDate),
                sponsorshipTarget: target.sponsorshipTarget,
                tasksTarget: target.tasksTarget,
                votersTarget: target.votersTarget
            });

            console.log('✅ Target loaded for editing');
        } catch (error) {
            console.error('Failed to load target:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to load target',
                life: 3000
            });
        }
    }

    filterExecutives(event: any) {
        const query = event.query.toLowerCase();
        this.filteredExecutives = this.allExecutives.filter(
            (exec) =>
                exec.name.toLowerCase().includes(query) ||
                exec.employeeId.toLowerCase().includes(query) ||
                exec.email.toLowerCase().includes(query)
        );
    }

    onExecutiveSelect(event: any) {
        const executive = event?.value ?? event;
        if (executive) {
            this.selectedExecutiveName = executive.name;
            this.selectedExecutive = executive;
            this.targetForm.patchValue({
                executiveId: executive._id
            });
        }
    }

    onCancel() {
        this.router.navigate(['/targets/targets-list']);
    }

    async onSubmit() {
        if (this.targetForm.invalid) {
            this.messageService.add({
                severity: 'error',
                summary: 'Validation Error',
                detail: 'Please fill all required fields'
            });
            return;
        }

        const formValue = this.targetForm.value;

        try {
            if (this.isEditMode && this.currentTargetId) {
                // UPDATE
                const updates: UpdateTargetData = {
                    sponsorshipTarget: formValue.sponsorshipTarget,
                    tasksTarget: formValue.tasksTarget,
                    votersTarget: formValue.votersTarget,
                    endDate: formValue.endDate.getTime()
                };
                await this.targetService.updateTarget(
                    this.currentTargetId,
                    updates
                );
            } else {
                // CREATE
                const targetData: CreateTargetData = {
                    executiveId: formValue.executiveId,
                    period: formValue.period,
                    startDate: formValue.startDate.getTime(),
                    endDate: formValue.endDate.getTime(),
                    sponsorshipTarget: formValue.sponsorshipTarget,
                    tasksTarget: formValue.tasksTarget,
                    votersTarget: formValue.votersTarget
                };
                await this.targetService.createTarget(targetData);
            }

            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Target saved successfully'
            });
            setTimeout(
                () => this.router.navigate(['/targets/targets-list']),
                1000
            );
        } catch (error: any) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: error?.message || 'Failed to save target'
            });
        }
    }
}