import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    FormGroup,
    Validators,
    ReactiveFormsModule,
    FormArray,
    FormsModule
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

// PrimeNG Imports
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { AvatarModule } from 'primeng/avatar';
import { FileUploadModule } from 'primeng/fileupload';
import { MultiSelectModule } from 'primeng/multiselect';
import { TabsModule } from 'primeng/tabs';
import { CardModule } from 'primeng/card';

// Services
import { Id } from 'convex/_generated/dataModel';
import { UserService } from '@/features/user-management/user.service';
import { WardsService } from '@/features/hr-recruitment/services/wards.service';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-executive-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MultiSelectModule,
        ButtonModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        AvatarModule,
        FileUploadModule,
        DatePickerModule,
        TabsModule,
        CardModule,
        FormsModule
    ],
    providers: [MessageService],
    templateUrl: './executive-form.component.html',
    styleUrls: ['./executive-form.component.scss']
})
export class ExecutiveFormComponent implements OnInit {
    executiveForm!: FormGroup;
    loading = false;
    submitting = false;
    isEditMode = false;
    executiveId: Id<'executives'> | null = null;
    
    // ✅ NEW: For blanketed position support
    executiveRoleLevel = signal<number | undefined>(undefined);
    isLoadingManagers = signal(false);

    // ✅ Dropdown options
    departments: Array<{ label: string; value: string }> = [
        { label: 'Sales', value: 'sales' },
        { label: 'Operations', value: 'operations' },
        { label: 'Field Services', value: 'field-services' },
        { label: 'Customer Support', value: 'customer-support' }
    ];

    contractTypes: Array<{ label: string; value: string }> = [
        { label: 'Full-Time', value: 'full-time' },
        { label: 'Part-Time', value: 'part-time' },
        { label: 'Contract', value: 'contract' },
        { label: 'Temporary', value: 'temporary' },
        { label: 'Internship', value: 'internship' }
    ];

    managers = signal<Array<{ label: string; value: string }>>([]);

    regions: Array<{ label: string; value: string }> = [
        { label: 'North', value: 'north' },
        { label: 'South', value: 'south' },
        { label: 'East', value: 'east' },
        { label: 'West', value: 'west' }
    ];

    hierarchies: Array<{ _id: string; name: string }> = [];

    // ✅ Ward selection signals
    zones = signal<Array<{ value: string; label: string }>>([]);
    districts = signal<Array<{ value: string; label: string }>>([]);
    subdistricts = signal<Array<{ value: string; label: string }>>([]);
    localBodies = signal<Array<{ value: string; label: string }>>([]);
    availableWards = signal<Array<{ value: string; label: string; fullPath?: string }>>([]);

    // ✅ Loading states
    loadingDistricts = signal(false);
    loadingSubdistricts = signal(false);
    loadingLocalBodies = signal(false);
    loadingWards = signal(false);

    constructor(
        private fb: FormBuilder,
        private userService: UserService,
        private wardsService: WardsService,
        private messageService: MessageService,
        private route: ActivatedRoute,
        private router: Router
    ) {}

    async ngOnInit(): Promise<void> {
        this.initializeForm();
        await this.loadFormData();

        // Check if edit mode
        this.route.params.subscribe(async (params) => {
            if (params['id']) {
                this.isEditMode = true;
                this.executiveId = params['id'] as Id<'executives'>;
                await this.loadExecutiveData(this.executiveId);
            }
        });
    }

    private initializeForm() {
        this.executiveForm = this.fb.group({
            employeeId: [{ value: this.generateEmployeeId(), disabled: true }],
            dateOfJoining: [{ value: new Date(), disabled: true }],

            personalDetails: this.fb.group({
                firstName: ['', Validators.required],
                lastName: ['', Validators.required],
                dateOfBirth: [null],
                primaryPhone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
                workEmail: ['', [Validators.required, Validators.email]],
                governmentId: [''],
                currentAddress: ['']
            }),

            employmentHierarchy: this.fb.group({
                jobTitle: ['Field Executive'],
                department: [null],
                contractType: [null],
                reportingManagerId: [null, Validators.required],
                hierarchyId: [null],
                wardIds: [[], Validators.required],

                wardFilters: this.fb.group({
                    zone: [null],
                    district: [null],
                    subdistrict: [null],
                    localBody: [null]
                })
            }),

            areaOfOperation: this.fb.group({
                region: [null],
                primaryTerritory: [''],
                assignedZones: [[]]
            }),

            assignedAssets: this.fb.array([])
        });

        // ✅ Disable email in edit mode
        if (this.isEditMode) {
            this.executiveForm.get('personalDetails.workEmail')?.disable();
        }
    }

    get wardFiltersGroup(): FormGroup {
        return this.executiveForm.get('employmentHierarchy.wardFilters') as FormGroup;
    }

    private async loadFormData() {
        try {
            this.loading = true;

            this.hierarchies = await this.userService.getHierarchies();
            const zonesData = await this.wardsService.getZones();
            this.zones.set(zonesData);

            console.log('✅ Form data loaded');
        } catch (error) {
            console.error('❌ Error loading form data:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to load form data. Please try again.'
            });
        } finally {
            this.loading = false;
        }
    }

    private async loadExecutiveData(executiveId: Id<'executives'>): Promise<void> {
        try {
            const executive = await this.userService.getExecutiveForEdit(executiveId);

            // Set employee ID and join date
            this.executiveForm.patchValue({
                employeeId: executive.employeeId,
                dateOfJoining: new Date(executive.joinDate)
            });

            // Populate personal details
            this.executiveForm.get('personalDetails')?.patchValue({
                firstName: executive.firstName || '',
                lastName: executive.lastName || '',
                dateOfBirth: executive.dateOfBirth ? new Date(executive.dateOfBirth) : null,
                primaryPhone: executive.phone,
                workEmail: executive.email,
                governmentId: executive.governmentId || '',
                currentAddress: executive.currentAddress || ''
            });

            // Populate employment details
            this.executiveForm.get('employmentHierarchy')?.patchValue({
                jobTitle: executive.jobTitle || 'Field Executive',
                department: executive.department,
                contractType: executive.contractType,
                reportingManagerId: executive.managerId,
                hierarchyId: executive.hierarchyId
            });

            // Populate area of operation
            this.executiveForm.get('areaOfOperation')?.patchValue({
                region: executive.region,
                primaryTerritory: executive.primaryTerritory || '',
                assignedZones: executive.assignedZones || []
            });

            // ✅ Load geographic data and wards
            if (executive.zone) {
                await this.loadDistrictsForZone(executive.zone);
                this.wardFiltersGroup.patchValue({ zone: executive.zone });
            }

            if (executive.district) {
                await this.loadSubdistrictsForDistrict(executive.zone!, executive.district);
                this.wardFiltersGroup.patchValue({ district: executive.district });
            }

            if (executive.subdistrict) {
                await this.loadLocalBodiesForSubdistrict(
                    executive.zone!,
                    executive.district!,
                    executive.subdistrict
                );
                this.wardFiltersGroup.patchValue({ subdistrict: executive.subdistrict });
            }

            // Load wards from assignedWards
            if (executive.assignedWards && executive.assignedWards.length > 0) {
                this.executiveForm.get('employmentHierarchy.wardIds')?.setValue(executive.assignedWards);
            }

            // ✅ Load managers after geography is set
            await this.loadManagers();

            console.log('✅ Executive data loaded for editing:', executive);
        } catch (error: any) {
            console.error('❌ Failed to load executive data:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: error.message || 'Failed to load executive data'
            });
            this.router.navigate(['/user-management/executives']);
        }
    }

    // ============================================================================
    // CASCADING LOCATION HANDLERS
    // ============================================================================

    private async loadDistrictsForZone(zone: string): Promise<void> {
        this.loadingDistricts.set(true);
        try {
            const data = await this.wardsService.getDistricts(zone);
            this.districts.set(data);
        } finally {
            this.loadingDistricts.set(false);
        }
    }

    private async loadSubdistrictsForDistrict(zone: string, district: string): Promise<void> {
        this.loadingSubdistricts.set(true);
        try {
            const data = await this.wardsService.getSubdistricts(zone, district);
            this.subdistricts.set(data);
        } finally {
            this.loadingSubdistricts.set(false);
        }
    }

    private async loadLocalBodiesForSubdistrict(
        zone: string,
        district: string,
        subdistrict: string
    ): Promise<void> {
        this.loadingLocalBodies.set(true);
        try {
            const data = await this.wardsService.getLocalBodies(zone, district, subdistrict);
            this.localBodies.set(data);
        } finally {
            this.loadingLocalBodies.set(false);
        }
    }

    // ============================================================================
    // ✅ NEW: MANAGER LOADING LOGIC
    // ============================================================================

    /**
     * ✅ Load managers based on geography and wards
     * Supports both ward-based and blanketed positions
     */
async loadManagers() {
    const zone = this.wardFiltersGroup.get('zone')?.value;
    const district = this.wardFiltersGroup.get('district')?.value;
    const subdistrict = this.wardFiltersGroup.get('subdistrict')?.value;
    const wardIds = this.executiveForm.get('employmentHierarchy.wardIds')?.value || [];
    const roleLevel = this.executiveRoleLevel();

    // Require at least zone to be selected
    if (!zone) {
        this.managers.set([]);
        return;
    }

    this.isLoadingManagers.set(true);

    try {
        console.log('🔍 Loading managers with params (before cleanup):', {
            zone,
            district,
            subdistrict,
            wardIds,
            roleLevel,
        });

        // ✅ FIX: Convert null to undefined for backend
        const params: any = {
            zone: zone || undefined,
            district: district || undefined,
            subdistrict: subdistrict || undefined,
            wardIds: wardIds.length > 0 ? wardIds : undefined,
            executiveRoleLevel: roleLevel,
        };

        // ✅ Remove undefined keys (backend expects missing keys, not undefined values)
        Object.keys(params).forEach(key => {
            if (params[key] === undefined) {
                delete params[key];
            }
        });

        console.log('🔍 Loading managers with params (after cleanup):', params);

        const managersData = await this.userService.getManagersForExecutiveByGeography(params);

        this.managers.set(managersData);

        // Auto-select if only one manager available and not in edit mode
        if (managersData.length === 1 && !this.isEditMode) {
            this.executiveForm.get('employmentHierarchy.reportingManagerId')?.setValue(managersData[0].value);
            console.log('✅ Auto-selected single manager:', managersData[0].label);
        }

        console.log(`✅ Loaded ${managersData.length} manager options`);
    } catch (error) {
        console.error('❌ Failed to load managers:', error);
        this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load managers',
        });
        this.managers.set([]);
    } finally {
        this.isLoadingManagers.set(false);
    }
}

    /**
     * ✅ Set executive role level (for blanketed positions)
     */
    setExecutiveRoleLevel(roleLevel: number | undefined) {
        this.executiveRoleLevel.set(roleLevel);

        console.log('👔 Role level set:', roleLevel);

        // Clear wards if blanketed position
        if (roleLevel !== undefined) {
            this.executiveForm.get('employmentHierarchy.wardIds')?.setValue([]);
            console.log('📍 Cleared wards for blanketed position');
        }

        // Reload managers
        this.loadManagers();
    }

    // ============================================================================
    // GEOGRAPHY CHANGE HANDLERS
    // ============================================================================

    async onZoneChange(event: any) {
        const zone = event.value;
        
        this.wardFiltersGroup.patchValue({
            district: null,
            subdistrict: null,
            localBody: null
        });
        
        this.districts.set([]);
        this.subdistricts.set([]);
        this.localBodies.set([]);
        this.availableWards.set([]);
        this.executiveForm.get('employmentHierarchy.wardIds')?.setValue([]);

        if (zone) {
            await this.loadDistrictsForZone(zone);
        }

        // ✅ Reload managers when zone changes
        await this.loadManagers();
    }

    async onDistrictChange(event: any) {
        const district = event.value;
        const zone = this.wardFiltersGroup.get('zone')?.value;

        this.wardFiltersGroup.patchValue({
            subdistrict: null,
            localBody: null
        });
        
        this.subdistricts.set([]);
        this.localBodies.set([]);
        this.availableWards.set([]);
        this.executiveForm.get('employmentHierarchy.wardIds')?.setValue([]);

        if (district && zone) {
            await this.loadSubdistrictsForDistrict(zone, district);
        }

        // ✅ Reload managers when district changes
        await this.loadManagers();
    }

    async onSubdistrictChange(event: any) {
        const subdistrict = event.value;
        const zone = this.wardFiltersGroup.get('zone')?.value;
        const district = this.wardFiltersGroup.get('district')?.value;

        this.wardFiltersGroup.patchValue({ localBody: null });
        this.localBodies.set([]);
        this.availableWards.set([]);
        this.executiveForm.get('employmentHierarchy.wardIds')?.setValue([]);

        if (subdistrict && zone && district) {
            await this.loadLocalBodiesForSubdistrict(zone, district, subdistrict);
        }

        // ✅ Reload managers when subdistrict changes
        await this.loadManagers();
    }

    async onLocalBodyChange(event: any) {
        const localBody = event.value;
        const zone = this.wardFiltersGroup.get('zone')?.value;
        const district = this.wardFiltersGroup.get('district')?.value;
        const subdistrict = this.wardFiltersGroup.get('subdistrict')?.value;

        this.executiveForm.get('employmentHierarchy.wardIds')?.setValue([]);
        this.availableWards.set([]);

        if (!zone || !district || !subdistrict || !localBody) return;

        this.loadingWards.set(true);
        try {
            const data = await this.wardsService.getWards(zone, district, subdistrict, localBody, 200);
            this.availableWards.set(data);
            console.log('✅ Wards loaded:', data.length);
        } catch (error) {
            console.error('❌ Failed to load wards:', error);
        } finally {
            this.loadingWards.set(false);
        }
    }

    /**
     * ✅ Handle ward selection changes
     */
    onWardsChange(event: any) {
        const wardIds = event.value || [];
        console.log('📍 Wards selected:', wardIds);

        // ✅ Reload managers based on selected wards
        this.loadManagers();
    }

    async onHierarchyChange(event: any) {
        const hierarchyId = event.value;
        if (!hierarchyId) return;

        try {
            const managersData = await this.userService.getManagersByHierarchy(hierarchyId);
            this.managers.set(managersData.map((m) => ({
                label: `${m.name} (${m.email})`,
                value: m._id
            })));
        } catch (error) {
            console.error('❌ Error loading managers:', error);
        }
    }

    // ============================================================================
    // FORM HELPERS
    // ============================================================================

    private generateEmployeeId(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const seq = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
        return `EXE-${year}${month}${day}-${seq}`;
    }

    get fullName(): string {
        const firstName = this.executiveForm.get('personalDetails.firstName')?.value || '';
        const lastName = this.executiveForm.get('personalDetails.lastName')?.value || '';
        return `${firstName} ${lastName}`.trim() || 'New Executive';
    }

    get jobTitle(): string {
        return this.executiveForm.get('employmentHierarchy.jobTitle')?.value || 'Field Executive';
    }

    get avatarInitials(): string {
        const firstName = this.executiveForm.get('personalDetails.firstName')?.value || '';
        const lastName = this.executiveForm.get('personalDetails.lastName')?.value || '';
        const firstInitial = firstName.charAt(0).toUpperCase();
        const lastInitial = lastName.charAt(0).toUpperCase();
        return firstInitial + lastInitial || 'NE';
    }

    get assignedAssets(): FormArray {
        return this.executiveForm.get('assignedAssets') as FormArray;
    }

    newAsset(): FormGroup {
        return this.fb.group({
            assetType: ['', Validators.required],
            assetId: ['', Validators.required],
            dateOfAssignment: [new Date(), Validators.required]
        });
    }

    addAsset() {
        this.assignedAssets.push(this.newAsset());
    }

    removeAsset(index: number) {
        this.assignedAssets.removeAt(index);
    }

    private removeNulls(obj: any): any {
        return Object.entries(obj).reduce((acc, [key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                acc[key] = value;
            }
            return acc;
        }, {} as any);
    }

    checkFormValidity() {
        console.log('=== FORM VALIDATION DEBUG ===');
        console.log('Form Valid:', this.executiveForm.valid);
        console.log('Form Invalid:', this.executiveForm.invalid);
        console.log('Form Value:', this.executiveForm.value);

        Object.keys(this.executiveForm.controls).forEach((key) => {
            const control = this.executiveForm.get(key);
            if (control && control.invalid) {
                console.log(`❌ ${key} is INVALID:`, control.errors);

                if (control instanceof FormGroup) {
                    Object.keys((control as FormGroup).controls).forEach((nestedKey) => {
                        const nestedControl = control.get(nestedKey);
                        if (nestedControl && nestedControl.invalid) {
                            console.log(`  ❌ ${key}.${nestedKey} is INVALID:`, nestedControl.errors);
                        }
                    });
                }
            }
        });
    }

    private markFormGroupTouched(formGroup: FormGroup) {
        Object.keys(formGroup.controls).forEach((key) => {
            const control = formGroup.get(key);
            control?.markAsTouched();

            if (control instanceof FormGroup) {
                this.markFormGroupTouched(control);
            }
        });
    }

    // ============================================================================
    // FORM SUBMISSION
    // ============================================================================

    async onSubmit() {
        // ✅ Validation for ward-based positions
        if (!this.executiveRoleLevel() && (!this.executiveForm.get('employmentHierarchy.wardIds')?.value?.length)) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Please select at least one ward for ward-based positions',
            });
            return;
        }

        if (this.executiveForm.invalid) {
            this.messageService.add({
                severity: 'error',
                summary: 'Form Invalid',
                detail: 'Please fill all required fields'
            });
            this.markFormGroupTouched(this.executiveForm);
            return;
        }

        try {
            this.submitting = true;

            if (this.isEditMode && this.executiveId) {
                await this.updateExecutive();
            } else {
                await this.createExecutive();
            }
        } catch (error: any) {
            console.error('❌ Error:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: error.message || 'Failed to process request'
            });
        } finally {
            this.submitting = false;
        }
    }

    private async createExecutive(): Promise<void> {
        const formValue = this.executiveForm.getRawValue();
        const personalDetails = formValue.personalDetails;
        const employment = formValue.employmentHierarchy;
        const areaOfOperation = formValue.areaOfOperation;

        const wardIds = employment.wardIds;
        if (!wardIds || wardIds.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation',
                detail: 'Please select at least one ward'
            });
            return;
        }

        const executiveData = this.removeNulls({
            email: personalDetails.workEmail,
            firstName: personalDetails.firstName,
            lastName: personalDetails.lastName,
            phone: personalDetails.primaryPhone,
            employeeId: formValue.employeeId,
            dateOfBirth: personalDetails.dateOfBirth?.getTime(),
            governmentId: personalDetails.governmentId,
            currentAddress: personalDetails.currentAddress,
            jobTitle: employment.jobTitle,
            department: employment.department,
            contractType: employment.contractType,
            managerId: employment.reportingManagerId as Id<'admin_users'>,
            hierarchyId: employment.hierarchyId as Id<'hierarchies'>,
            wardIds: wardIds,
            region: areaOfOperation.region,
            primaryTerritory: areaOfOperation.primaryTerritory,
            assignedZones: areaOfOperation.assignedZones
        });

        await this.userService.createExecutive(executiveData);

        this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Executive created successfully!'
        });
        this.router.navigate(['/user-management/executives']);
    }

    private async updateExecutive(): Promise<void> {
        const formValue = this.executiveForm.getRawValue();
        const personalDetails = formValue.personalDetails;
        const employment = formValue.employmentHierarchy;
        const areaOfOperation = formValue.areaOfOperation;

        const wardIds = employment.wardIds;
        if (!wardIds || wardIds.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation',
                detail: 'Please select at least one ward'
            });
            return;
        }

        const updateData = this.removeNulls({
            executiveId: this.executiveId!,
            firstName: personalDetails.firstName,
            lastName: personalDetails.lastName,
            phone: personalDetails.primaryPhone,
            dateOfBirth: personalDetails.dateOfBirth?.getTime(),
            governmentId: personalDetails.governmentId,
            currentAddress: personalDetails.currentAddress,
            jobTitle: employment.jobTitle,
            department: employment.department,
            contractType: employment.contractType,
            managerId: employment.reportingManagerId as Id<'admin_users'>,
            wardIds: wardIds,
            region: areaOfOperation.region,
            primaryTerritory: areaOfOperation.primaryTerritory,
            assignedZones: areaOfOperation.assignedZones
        });

        await this.userService.updateExecutive(updateData);

        this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Executive updated successfully!'
        });
        this.router.navigate(['/user-management/executives']);
    }

    isFieldInvalid(fieldPath: string): boolean {
        const field = this.executiveForm.get(fieldPath);
        return !!(field && field.invalid && (field.dirty || field.touched));
    }

    onCancel() {
        this.router.navigate(['/user-management/executives']);
    }

    /**
     * Get ward label by ID
     */
    getWardLabel(wardId: string): string {
        const ward = this.availableWards().find(w => w.value === wardId);
        return ward?.label || wardId;
    }
}