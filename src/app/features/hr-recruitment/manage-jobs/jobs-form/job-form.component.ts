// job-form.component.ts

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    FormGroup,
    Validators,
    ReactiveFormsModule,
    FormArray,
    FormControl
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { EditorModule } from 'primeng/editor';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { Id } from 'convex/_generated/dataModel';
import { JobsService } from '../services/jobs.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ConvexService } from '../../../../core/services/convex.service';
import { api } from 'convex/_generated/api';
import { ROLE_LEVELS } from 'convex/users/_lib';

interface OptionItem {
    value: string;
    label: string;
    wardCode?: string;
    fullPath?: string;
}

@Component({
    selector: 'app-job-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ButtonModule,
        InputTextModule,
        EditorModule,
        SelectModule,
        InputNumberModule,
        DatePickerModule,
        ToastModule,
        CardModule,
        CheckboxModule,
        DividerModule,
        TagModule
    ],
    templateUrl: './job-form.component.html',
    styleUrls: ['./job-form.component.scss'],
    providers: [MessageService]
})
export class JobFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private jobsService = inject(JobsService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private messageService = inject(MessageService);
    private authService = inject(AuthService);
    private convex = inject(ConvexService);
  
    jobLevels = Object.keys(ROLE_LEVELS).map((key) => ({
        label: key
            .toLowerCase()
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase()),
        value: key
    }));

    jobForm!: FormGroup;
    isEditMode = false;
    jobId: Id<'job_postings'> | null = null;
    loading = false;
    submitted = false;

    // used in template for *ngIf / *ngSwitch
    currentJobLevel: string | null = null;

    employmentTypes = [
        { label: 'Full-time', value: 'full_time' },
        { label: 'Part-time', value: 'part_time' },
        { label: 'Contract', value: 'contract' }
    ];

    minDate = new Date();

    zones: OptionItem[] = [];
    districts: OptionItem[] = [];
    subdistricts: OptionItem[] = [];
    localBodyTypes: OptionItem[] = [];
    localBodies: OptionItem[] = [];
    wards: OptionItem[] = [];

    selectedZone: string | null = null;
    selectedDistrict: string | null = null;
    selectedSubdistrict: string | null = null;
    selectedLocalBodyType: string | null = null;
    selectedLocalBodyName: string | null = null;

    loadingDistricts = false;
    loadingSubdistricts = false;
    loadingLocalBodies = false;
    loadingWards = false;

    get wardCount(): number {
        return this.wards.length;
    }

    get wardControl(): FormControl {
        return this.jobForm.get('wardId') as FormControl;
    }

    async ngOnInit() {
        const user = this.authService.currentUser();
        if (!user) {
            this.messageService.add({
                severity: 'error',
                summary: 'Unauthorized',
                detail: 'You must be logged in to access this page'
            });
            this.router.navigate(['/auth/login']);
            return;
        }

        if (!this.authService.can('canManageHR')) {
            this.messageService.add({
                severity: 'error',
                summary: 'Access Denied',
                detail: 'You do not have permission to manage job postings'
            });
            this.router.navigate(['/recruitment/jobs']);
            return;
        }

        this.initForm();

        await this.loadZones();
        await this.loadLocalBodyTypes();

        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode = true;
            this.jobId = id as Id<'job_postings'>;
            await this.loadJobData();
        }

        // keep TS and template in sync
        this.currentJobLevel = this.jobForm.get('jobLevel')?.value || null;

        this.jobForm
            .get('jobLevel')
            ?.valueChanges.subscribe((level: string) => {
                this.currentJobLevel = level || null;
                
                // Auto-populate title from job level
                if (level) {
                    const formattedTitle = level
                        .toLowerCase()
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, (c) => c.toUpperCase());
                    this.jobForm.patchValue({ title: formattedTitle }, { emitEvent: false });
                }
                
                // Update validators AFTER setting the title
                this.updateGeoValidatorsForLevel(level);
                this.resetGeoSelection();
            });

        this.jobForm
            .get('isBlanketed')
            ?.valueChanges.subscribe((isBlanketed: boolean) => {
                const wardIdControl = this.jobForm.get('wardId');
                if (isBlanketed) {
                    wardIdControl?.clearValidators();
                    wardIdControl?.setValue(null);
                    wardIdControl?.setErrors(null);
                    this.loadWardsForBlanketedJob();
                } else {
                    if (this.requiresWard(this.currentJobLevel)) {
                        wardIdControl?.setValidators(Validators.required);
                    } else {
                        wardIdControl?.clearValidators();
                        wardIdControl?.setErrors(null);
                    }
                }
                wardIdControl?.updateValueAndValidity();
            });
    }

    private initForm() {
        const user = this.authService.currentUser();

        this.jobForm = this.fb.group({
            jobLevel: [null, Validators.required],
            title: ['', [Validators.required, Validators.minLength(3)]],
            description: ['', Validators.required],
            location: ['', Validators.required],
            employmentType: ['full_time', Validators.required],
            salaryMin: [0, [Validators.required, Validators.min(0)]],
            salaryMax: [0, [Validators.required, Validators.min(0)]],
            applicationDeadline: [null, Validators.required],
            requirements: this.fb.array([this.createRequirementControl()]),
            isBlanketed: [false],
            zone: [null],
            district: [null],
            subdistrict: [null],
            localBodyType: [null],
            localBodyName: [null],
            wardId: [null],
            restrictToWardScope: [false],
        });

        if (user) {
            this.jobForm.patchValue({
                location: user.hierarchyName || ''
            });
        }
    }

    // --- geo validators --------------------------------------------------------

    private updateGeoValidatorsForLevel(level: string | null) {
        const geoFields = [
            'zone',
            'district',
            'subdistrict',
            'localBodyName',
            'wardId'
        ] as const;

        const required: Record<(typeof geoFields)[number], boolean> = {
            zone: false,
            district: false,
            subdistrict: false,
            localBodyName: false,
            wardId: false
        };

        // Only set requirements for levels that need geo fields
        if (level !== 'STATE_HEAD' && level !== 'SUPER_ADMIN') {
            switch (level) {
                case 'EXECUTIVE':
                case 'WARD_MANAGER':
                    required.zone = true;
                    required.district = true;
                    required.subdistrict = true;
                    required.localBodyName = true;
                    required.wardId = true;
                    break;

                case 'LOCAL_BODY_MANAGER':
                    required.zone = true;
                    required.district = true;
                    required.subdistrict = true;
                    required.localBodyName = true;
                    break;

                case 'SUBDISTRICT_MANAGER':
                    required.zone = true;
                    required.district = true;
                    required.subdistrict = true;
                    break;

                case 'DISTRICT_MANAGER':
                    required.zone = true;
                    required.district = true;
                    break;

                case 'ZONAL_MANAGER':
                    required.zone = true;
                    break;

                default:
                    break;
            }
        }

        geoFields.forEach((field) => {
            const control = this.jobForm.get(field);
            if (!control) return;

            const validators = [];
            if (required[field]) {
                validators.push(Validators.required);
            }
            
            control.setValidators(validators);
            control.updateValueAndValidity();
            
            // Clear errors if field is not required
            if (!required[field]) {
                control.setErrors(null);
            }
        });
    }

    private requiresWard(level: string | null): boolean {
        return level === 'EXECUTIVE' || level === 'WARD_MANAGER';
    }

    isGeoFieldRequired(fieldName: string): boolean {
        const level = this.currentJobLevel;
        if (!level) return false;

        // STATE_HEAD and SUPER_ADMIN don't require any geo fields
        if (level === 'STATE_HEAD' || level === 'SUPER_ADMIN') {
            return false;
        }

        const requirements: Record<string, string[]> = {
            'EXECUTIVE': ['zone', 'district', 'subdistrict', 'localBodyName', 'wardId'],
            'WARD_MANAGER': ['zone', 'district', 'subdistrict', 'localBodyName', 'wardId'],
            'LOCAL_BODY_MANAGER': ['zone', 'district', 'subdistrict', 'localBodyName'],
            'SUBDISTRICT_MANAGER': ['zone', 'district', 'subdistrict'],
            'DISTRICT_MANAGER': ['zone', 'district'],
            'ZONAL_MANAGER': ['zone']
        };

        const isBlanketed = this.jobForm?.get('isBlanketed')?.value;
        if (fieldName === 'wardId' && isBlanketed) {
            return false;
        }

        return requirements[level]?.includes(fieldName) || false;
    }

    private resetGeoSelection() {
        this.selectedZone = null;
        this.selectedDistrict = null;
        this.selectedSubdistrict = null;
        this.selectedLocalBodyType = null;
        this.selectedLocalBodyName = null;
        this.districts = [];
        this.subdistricts = [];
        this.localBodies = [];
        this.wards = [];

        this.jobForm.patchValue({
            zone: null,
            district: null,
            subdistrict: null,
            localBodyType: null,
            localBodyName: null,
            wardId: null,
            isBlanketed: false
        });
    }

    // --- requirements array ----------------------------------------------------

    createRequirementControl() {
        return this.fb.control('', Validators.required);
    }

    get requirementsArray(): FormArray {
        return this.jobForm.get('requirements') as FormArray;
    }

    addRequirement() {
        this.requirementsArray.push(this.createRequirementControl());
    }

    removeRequirement(index: number) {
        if (this.requirementsArray.length > 1) {
            this.requirementsArray.removeAt(index);
        }
    }

    // --- API loaders -----------------------------------------------------------

    async loadZones() {
        try {
            const data = await this.convex.client.query(api.wards.getZones, {});
            this.zones = data;
        } catch (error) {
            console.error('Failed to load zones:', error);
        }
    }

    async loadLocalBodyTypes() {
        try {
            const data = await this.convex.client.query(
                api.wards.getLocalBodyTypes,
                {}
            );
            this.localBodyTypes = data;
        } catch (error) {
            console.error('Failed to load local body types:', error);
        }
    }

    async loadDistricts() {
        if (!this.selectedZone) return;
        this.loadingDistricts = true;
        try {
            const data = await this.convex.client.query(
                api.wards.getDistricts,
                {
                    zone: this.selectedZone
                }
            );
            this.districts = data;
        } catch (error) {
            console.error('Failed to load districts:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to load districts. Please try again.'
            });
        } finally {
            this.loadingDistricts = false;
        }
    }

    async loadSubdistricts() {
        if (!this.selectedZone || !this.selectedDistrict) return;
        this.loadingSubdistricts = true;
        try {
            const data = await this.convex.client.query(
                api.wards.getSubdistricts,
                {
                    zone: this.selectedZone,
                    district: this.selectedDistrict
                }
            );
            this.subdistricts = data;
        } catch (error) {
            console.error('Failed to load subdistricts:', error);
        } finally {
            this.loadingSubdistricts = false;
        }
    }

    async loadLocalBodies() {
        if (
            !this.selectedZone ||
            !this.selectedDistrict ||
            !this.selectedSubdistrict
        )
            return;
        this.loadingLocalBodies = true;
        try {
            const data = await this.convex.client.query(
                api.wards.getLocalBodies,
                {
                    zone: this.selectedZone,
                    district: this.selectedDistrict,
                    subdistrict: this.selectedSubdistrict,
                    localBodyType: this.selectedLocalBodyType || undefined
                }
            );
            this.localBodies = data;
        } catch (error) {
            console.error('Failed to load local bodies:', error);
        } finally {
            this.loadingLocalBodies = false;
        }
    }

    async loadWards() {
        if (
            !this.selectedZone ||
            !this.selectedDistrict ||
            !this.selectedSubdistrict ||
            !this.selectedLocalBodyName
        )
            return;
        this.loadingWards = true;
        try {
            const data = await this.convex.client.query(api.wards.getWards, {
                zone: this.selectedZone,
                district: this.selectedDistrict,
                subdistrict: this.selectedSubdistrict,
                localBodyName: this.selectedLocalBodyName,
                limit: 500
            });
            this.wards = data;
        } catch (error) {
            console.error('Failed to load wards:', error);
        } finally {
            this.loadingWards = false;
        }
    }

    async loadWardsForDistrict() {
        if (!this.selectedZone || !this.selectedDistrict) return;
        this.loadingWards = true;
        try {
            const data = await this.convex.client.query(api.wards.getWards, {
                zone: this.selectedZone,
                district: this.selectedDistrict,
                limit: 5000
            });
            this.wards = data;
        } catch (error) {
            console.error('Failed to load wards for district:', error);
        } finally {
            this.loadingWards = false;
        }
    }

    async loadWardsForSubdistrict() {
        if (
            !this.selectedZone ||
            !this.selectedDistrict ||
            !this.selectedSubdistrict
        )
            return;
        this.loadingWards = true;
        try {
            const data = await this.convex.client.query(api.wards.getWards, {
                zone: this.selectedZone,
                district: this.selectedDistrict,
                subdistrict: this.selectedSubdistrict,
                limit: 5000
            });
            this.wards = data;
        } catch (error) {
            console.error('Failed to load wards for subdistrict:', error);
        } finally {
            this.loadingWards = false;
        }
    }

    async loadWardsForBlanketedJob() {
        if (this.selectedLocalBodyName && this.selectedSubdistrict) {
            await this.loadWards();
        } else if (this.selectedSubdistrict) {
            await this.loadWardsForSubdistrict();
        } else if (this.selectedDistrict) {
            await this.loadWardsForDistrict();
        }
    }

    // --- change handlers -------------------------------------------------------

    onZoneChange(event: any) {
        this.selectedZone = event.value;
        this.selectedDistrict = null;
        this.selectedSubdistrict = null;
        this.selectedLocalBodyType = null;
        this.selectedLocalBodyName = null;

        this.jobForm.patchValue({
            district: null,
            subdistrict: null,
            localBodyType: null,
            localBodyName: null,
            wardId: null
        });

        this.districts = [];
        this.subdistricts = [];
        this.localBodies = [];
        this.wards = [];

        this.loadDistricts();
        if (this.jobForm.get('isBlanketed')?.value) {
            this.loadWardsForBlanketedJob();
        }
    }

    onDistrictChange(event: any) {
        this.selectedDistrict = event.value;
        this.selectedSubdistrict = null;
        this.selectedLocalBodyType = null;
        this.selectedLocalBodyName = null;

        this.jobForm.patchValue({
            subdistrict: null,
            localBodyType: null,
            localBodyName: null,
            wardId: null
        });

        this.subdistricts = [];
        this.localBodies = [];
        this.wards = [];

        this.loadSubdistricts();
        if (this.jobForm.get('isBlanketed')?.value) {
            this.loadWardsForBlanketedJob();
        }
    }

    onSubdistrictChange(event: any) {
        this.selectedSubdistrict = event.value;
        this.selectedLocalBodyType = null;
        this.selectedLocalBodyName = null;

        this.jobForm.patchValue({
            localBodyType: null,
            localBodyName: null,
            wardId: null
        });

        this.localBodies = [];
        this.wards = [];

        this.loadLocalBodies();
        if (this.jobForm.get('isBlanketed')?.value) {
            this.loadWardsForBlanketedJob();
        }
    }

    onLocalBodyTypeChange(event: any) {
        this.selectedLocalBodyType = event.value;
        this.selectedLocalBodyName = null;

        this.jobForm.patchValue({
            localBodyName: null,
            wardId: null
        });

        this.localBodies = [];
        this.wards = [];

        this.loadLocalBodies();
    }

    onLocalBodyChange(event: any) {
        this.selectedLocalBodyName = event.value;
        this.jobForm.patchValue({
            wardId: null
        });
        this.wards = [];
        this.loadWards();
        if (this.jobForm.get('isBlanketed')?.value) {
            this.loadWardsForBlanketedJob();
        }
    }

    // --- helpers ---------------------------------------------------------------

    getSelectedWardPath(): string {
        const wardId = this.jobForm.get('wardId')?.value;
        if (!wardId) return '';
        const ward = this.wards.find((w) => w.value === wardId);
        return ward?.fullPath || '';
    }

    getWardNameById(wardId: string): string | undefined {
        const ward = this.wards.find((w) => w.value === wardId);
        return ward?.label;
    }

    // --- load & save -----------------------------------------------------------

    async loadJobData() {
        if (!this.jobId) return;
        this.loading = true;
        try {
            const job = await this.jobsService.getJobById(this.jobId);

            this.jobForm.patchValue({
                jobLevel: job.jobLevel,
                title: job.title,
                description: job.description,
                location: job.location,
                employmentType: job.employmentType,
                salaryMin: job.salaryMin,
                salaryMax: job.salaryMax,
                applicationDeadline: new Date(job.applicationDeadline),
                isBlanketed: job.isBlanketed,
                zone: job.zone,
                district: job.district,
                subdistrict: job.subdistrict,
                localBodyName: job.localBody,
                wardId: job.wardId,
                restrictToWardScope: job.restrictToWardScope ?? false
            });

            this.currentJobLevel = job.jobLevel;
            this.updateGeoValidatorsForLevel(job.jobLevel);

            if (job.requirements && job.requirements.length > 0) {
                this.requirementsArray.clear();
                job.requirements.forEach((req: string) => {
                    this.requirementsArray.push(
                        this.fb.control(req, Validators.required)
                    );
                });
            }
        } catch (error: any) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: error.message || 'Failed to load job details'
            });
            this.router.navigate(['/recruitment/jobs']);
        } finally {
            this.loading = false;
        }
    }

   async onSubmit() {
  this.submitted = true;

  if (this.jobForm.invalid) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please fill all required fields',
    });
    return;
  }

  const salaryMin = this.jobForm.value.salaryMin;
  const salaryMax = this.jobForm.value.salaryMax;
  if (salaryMin > salaryMax) {
    this.messageService.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: 'Minimum salary cannot be greater than maximum salary',
    });
    return;
  }

  const isBlanketed = this.jobForm.value.isBlanketed;
  const formData = this.jobForm.value;

  // Validate blanketed jobs have wards
  if (isBlanketed && this.wards.length === 0) {
    this.messageService.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: 'No wards found for selected area. Please refine your selection.',
    });
    return;
  }

  this.loading = true;
  try {
    const user = this.authService.currentUser();
    if (!user) throw new Error('User not authenticated');

    const deadline = new Date(formData.applicationDeadline).getTime();

    // Build targetWards correctly
    let targetWards: string[] | undefined;
    if (isBlanketed) {
      targetWards = this.wards.map((w) => w.value);
    } else if (formData.wardId) {
      targetWards = [formData.wardId];
    }

    // FIXED: Never send null to Convex - use undefined for optional fields
    const jobData = {
      title: formData.title,
      description: formData.description,
      requirements: formData.requirements.filter((r: string) => r.trim()),
      location: formData.location,
      employmentType: formData.employmentType,
      salaryMin: formData.salaryMin,
      salaryMax: formData.salaryMax,
      applicationDeadline: deadline,
      jobLevel: formData.jobLevel,

      // Geo fields - undefined if empty (Convex accepts this)
      zone: formData.zone || undefined,
      district: formData.district || undefined,
      subdistrict: formData.subdistrict || undefined,
      localBody: formData.localBodyName || undefined,
      ward: !isBlanketed && formData.wardId ? this.getWardNameById(formData.wardId) : undefined,

      hierarchyId: user.hierarchyId as Id<'hierarchies'> | undefined,
      isBlanketed,
      
      // CRITICAL FIX: wardId only when NOT blanketed AND wardId exists
      wardId: (!isBlanketed && formData.wardId) ? formData.wardId : undefined,
      restrictToWardScope: !!formData.restrictToWardScope,
      targetWards,
    };

    console.log('📤 Submitting jobData:', jobData);

    if (this.isEditMode && this.jobId) {
      await this.jobsService.updateJob(this.jobId, jobData);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Job updated successfully',
      });
    } else {
      await this.jobsService.createJob(jobData);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `Job created successfully (${targetWards?.length || 0} ward${(targetWards?.length || 0) > 1 ? 's' : ''} targeted)`,
      });
    }

    setTimeout(() => {
      this.router.navigate(['/recruitment/jobs']);
    }, 1000);
  } catch (error: any) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || `Failed to ${this.isEditMode ? 'update' : 'create'} job`,
    });
  } finally {
    this.loading = false;
  }
}


    onCancel() {
        this.router.navigate(['/recruitment/jobs']);
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.jobForm.get(fieldName);
        return !!(
            field &&
            field.invalid &&
            (field.dirty || field.touched || this.submitted)
        );
    }

    getFieldError(fieldName: string): string {
        const field = this.jobForm.get(fieldName);
        if (field?.errors) {
            if (field.errors['required']) return 'This field is required';
            if (field.errors['minlength'])
                return `Minimum length is ${field.errors['minlength'].requiredLength}`;
            if (field.errors['min'])
                return `Minimum value is ${field.errors['min'].min}`;
        }
        return '';
    }
}