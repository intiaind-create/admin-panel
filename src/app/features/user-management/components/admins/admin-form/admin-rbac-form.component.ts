import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { CreateAdminArgs } from '../../interfaces/userinterface';
import { Id } from 'convex/_generated/dataModel';
import { UserService } from '@/features/user-management/user.service';

@Component({
  selector: 'app-admin-rbac-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    SelectModule,
    MessageModule,
    TagModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './admin-rbac-form.component.html',
  styleUrls: ['./admin-rbac-form.component.scss'],
})
export class AdminRbacFormComponent implements OnInit {
  adminForm!: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  setupLink = '';
  adminId: Id<'admin_users'> | null = null;
  formError = signal<string | null>(null);

  // Configuration
  private readonly ROLE_HIERARCHY_REQUIREMENTS = {
    12: { zone: true, district: false, subdistrict: false, localBody: false, ward: false },
    11: { zone: true, district: false, subdistrict: false, localBody: false, ward: false },
    10: { zone: true, district: false, subdistrict: false, localBody: false, ward: false },
    8:  { zone: true, district: false, subdistrict: false, localBody: false, ward: false },
    6:  { zone: true, district: true, subdistrict: false, localBody: false, ward: false },
    4:  { zone: true, district: true, subdistrict: true, localBody: false, ward: false },
    2:  { zone: true, district: true, subdistrict: true, localBody: true, ward: true },
  } as const;

  private readonly ROLE_NAMES = {
    12: 'Super Admin',
    11: 'National Head',
    10: 'State Head',
    8: 'Zonal Manager',
    6: 'District Manager',
    4: 'Subdistrict Coordinator',
    2: 'Ward Coordinator',
  } as const;

  roleLevelOptions = [
    { label: '12 - Super Admin', value: 12 },
    { label: '11 - National Head', value: 11 },
    { label: '10 - State Head', value: 10 },
    { label: '8 - Zonal Manager', value: 8 },
    { label: '6 - District Manager', value: 6 },
    { label: '4 - Subdistrict Coordinator', value: 4 },
    { label: '2 - Ward Coordinator', value: 2 },
  ];

  // Signals
  currentRoleLevel = signal<number | null>(null);
  showZoneDropdown = signal(false);
  showDistrictDropdown = signal(false);
  showSubdistrictDropdown = signal(false);
  showLocalBodyDropdown = signal(false);
  showWardDropdown = signal(false);

  zones = signal<Array<{ value: string; label: string }>>([]);
  districts = signal<Array<{ value: string; label: string }>>([]);
  subdistricts = signal<Array<{ value: string; label: string }>>([]);
  localBodies = signal<Array<{ value: string; label: string }>>([]);
  wards = signal<Array<{ value: string; label: string }>>([]);
  managers = signal<Array<any>>([]);

  selectedZone = signal<string | null>(null);
  selectedDistrict = signal<string | null>(null);
  selectedSubdistrict = signal<string | null>(null);
  selectedLocalBody = signal<string | null>(null);
  selectedWard = signal<string | null>(null);
  selectedHierarchyPath = signal<string>('');

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    this.initializeForm();
    await this.loadHierarchyData();
    
    // Check if edit mode
    this.route.params.subscribe(async params => {
      if (params['id']) {
        this.isEditMode = true;
        this.adminId = params['id'] as Id<'admin_users'>;
        await this.loadAdminData(this.adminId);
      }
    });
  }

  private initializeForm(): void {
    this.adminForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      roleLevel: [null, Validators.required],
      managerId: [null],
    });

    // ✅ Disable email in edit mode (will be set after loading data)
    if (this.isEditMode) {
      this.adminForm.get('email')?.disable();
    }
  }

  private async loadHierarchyData(): Promise<void> {
    try {
      const zonesData = await this.userService.getZones();
      this.zones.set(zonesData);
    } catch (error) {
      console.error('Failed to load hierarchy data:', error);
      this.showError('Error', 'Failed to load hierarchy data');
    }
  }

  // ✅ Load admin data for editing
  private async loadAdminData(adminId: Id<'admin_users'>): Promise<void> {
    try {
      const admin = await this.userService.getAdminUserForEdit(adminId);
      
      // Populate form
      this.adminForm.patchValue({
        name: admin.name,
        email: admin.email,
        phone: admin.phone || '',
        roleLevel: admin.roleLevel,
        managerId: admin.managerId || null,
      });

      // Set role level and update dropdowns
      this.currentRoleLevel.set(admin.roleLevel);
      this.updateDropdownVisibility(admin.roleLevel);

      // ✅ Load geographic data if present
      if (admin.zone) {
        this.selectedZone.set(admin.zone);
        await this.loadDistrictsForZone(admin.zone);
      }

      if (admin.district) {
        this.selectedDistrict.set(admin.district);
        await this.loadSubdistrictsForDistrict(admin.zone!, admin.district);
      }

      if (admin.subdistrict) {
        this.selectedSubdistrict.set(admin.subdistrict);
        await this.loadLocalBodiesForSubdistrict(admin.zone!, admin.district!, admin.subdistrict);
      }

      if (admin.localBody) {
        this.selectedLocalBody.set(admin.localBody);
        await this.loadWardsForLocalBody(admin.zone!, admin.district!, admin.subdistrict!, admin.localBody);
      }

      if (admin.ward) {
        this.selectedWard.set(admin.ward);
      }

      this.updateHierarchyPath();

      console.log('✅ Admin data loaded for editing:', admin);
    } catch (error: any) {
      console.error('❌ Failed to load admin data:', error);
      this.showError('Error', error.message || 'Failed to load admin data');
      this.router.navigate(['/user-management/admins']);
    }
  }

  // ✅ Helper methods to load cascading data
  private async loadDistrictsForZone(zone: string): Promise<void> {
    const data = await this.userService.getDistricts(zone);
    this.districts.set(data);
  }

  private async loadSubdistrictsForDistrict(zone: string, district: string): Promise<void> {
    const data = await this.userService.getSubdistricts(zone, district);
    this.subdistricts.set(data);
  }

private async loadLocalBodiesForSubdistrict(zone: string, district: string, subdistrict: string): Promise<void> {
  const data = await this.userService.getLocalBodies({
    zone,
    district,
    subdistrict
  });
  this.localBodies.set(data);
}
private async loadWardsForLocalBody(zone: string, district: string, subdistrict: string, localBody: string): Promise<void> {
  const data = await this.userService.getWards({
    zone,
    district,
    subdistrict,
    localBodyName: localBody
  });
  this.wards.set(data);
}


  onRoleLevelChange(event: any): void {
    const roleLevel = event.value;
    this.currentRoleLevel.set(roleLevel);
    
    // ✅ Only reset hierarchy in create mode
    if (!this.isEditMode) {
      this.resetHierarchyFields();
    }
    
    this.updateDropdownVisibility(roleLevel);
  }

  private updateDropdownVisibility(roleLevel: number): void {
    const requirements = this.ROLE_HIERARCHY_REQUIREMENTS[roleLevel as keyof typeof this.ROLE_HIERARCHY_REQUIREMENTS] || {
      zone: false, district: false, subdistrict: false, localBody: false, ward: false
    };

    this.showZoneDropdown.set(requirements.zone);
    this.showDistrictDropdown.set(requirements.district);
    this.showSubdistrictDropdown.set(requirements.subdistrict);
    this.showLocalBodyDropdown.set(requirements.localBody);
    this.showWardDropdown.set(requirements.ward);
  }

  async onZoneChange(zone: string): Promise<void> {
    this.selectedZone.set(zone);
    this.selectedDistrict.set(null);
    this.selectedSubdistrict.set(null);
    this.selectedLocalBody.set(null);
    this.selectedWard.set(null);
    
    if (zone) {
      const data = await this.userService.getDistricts(zone);
      this.districts.set(data);
    }
    
    this.updateHierarchyPath();
  }

  async onDistrictChange(district: string): Promise<void> {
    this.selectedDistrict.set(district);
    this.selectedSubdistrict.set(null);
    this.selectedLocalBody.set(null);
    this.selectedWard.set(null);
    
    if (district && this.selectedZone()) {
      const data = await this.userService.getSubdistricts(this.selectedZone()!, district);
      this.subdistricts.set(data);
    }
    
    this.updateHierarchyPath();
  }

async onSubdistrictChange(subdistrict: string): Promise<void> {
  this.selectedSubdistrict.set(subdistrict);
  this.selectedLocalBody.set(null);
  this.selectedWard.set(null);
  
  if (subdistrict && this.selectedZone() && this.selectedDistrict()) {
    const data = await this.userService.getLocalBodies({
      zone: this.selectedZone()!,
      district: this.selectedDistrict()!,
      subdistrict: subdistrict
    });
    this.localBodies.set(data);
  }
  
  this.updateHierarchyPath();
}
async onLocalBodyChange(localBody: string): Promise<void> {
  this.selectedLocalBody.set(localBody);
  this.selectedWard.set(null);
  
  if (localBody && this.selectedZone() && this.selectedDistrict() && this.selectedSubdistrict()) {
    const data = await this.userService.getWards({
      zone: this.selectedZone()!,
      district: this.selectedDistrict()!,
      subdistrict: this.selectedSubdistrict()!,
      localBodyName: localBody
    });
    this.wards.set(data);
  }
  
  this.updateHierarchyPath();
}
  onWardChange(ward: string): void {
    this.selectedWard.set(ward);
    this.updateHierarchyPath();
  }

  private updateHierarchyPath(): void {
    const parts = [
      this.selectedZone(),
      this.selectedDistrict(),
      this.selectedSubdistrict(),
      this.selectedLocalBody(),
      this.selectedWard(),
    ].filter(Boolean);
    
    this.selectedHierarchyPath.set(parts.join(' > '));
  }

  private resetHierarchyFields(): void {
    this.selectedZone.set(null);
    this.selectedDistrict.set(null);
    this.selectedSubdistrict.set(null);
    this.selectedLocalBody.set(null);
    this.selectedWard.set(null);
    this.selectedHierarchyPath.set('');
    this.districts.set([]);
    this.subdistricts.set([]);
    this.localBodies.set([]);
    this.wards.set([]);
  }

  private validateHierarchySelection(): { valid: boolean; message: string } {
    const roleLevel = this.adminForm.value.roleLevel;
    const requirements = this.ROLE_HIERARCHY_REQUIREMENTS[roleLevel as keyof typeof this.ROLE_HIERARCHY_REQUIREMENTS];
    
    if (!requirements) {
      return { valid: true, message: '' };
    }

    const selections = {
      zone: this.selectedZone(),
      district: this.selectedDistrict(),
      subdistrict: this.selectedSubdistrict(),
      localBody: this.selectedLocalBody(),
      ward: this.selectedWard(),
    };

    const missingFields = Object.entries(requirements)
      .filter(([field, required]) => required && !selections[field as keyof typeof selections])
      .map(([field]) => field.charAt(0).toUpperCase() + field.slice(1));

    if (missingFields.length > 0) {
      const roleName = this.ROLE_NAMES[roleLevel as keyof typeof this.ROLE_NAMES] || 'this role';
      const fieldList = missingFields.join(', ');
      return { 
        valid: false, 
        message: `${roleName} requires: ${fieldList}` 
      };
    }

    return { valid: true, message: '' };
  }

  async onSubmit(): Promise<void> {
    console.log('submit called');
    
    if (this.adminForm.invalid) {
      this.markFormGroupTouched(this.adminForm);
      this.showError('Form Invalid', 'Please fill all required fields');
      return;
    }

    const hierarchyValidation = this.validateHierarchySelection();
    if (!hierarchyValidation.valid) {
      this.showWarning('Hierarchy Required', hierarchyValidation.message);
      return;
    }

    this.isSubmitting = true;
    this.setupLink = '';
    this.formError.set(null);

    try {
      if (this.isEditMode && this.adminId) {
        // ✅ UPDATE MODE
        await this.updateAdmin();
      } else {
        // ✅ CREATE MODE
        await this.createAdmin();
      }
    } catch (error: any) {
      console.error('❌ Error:', error);
      this.handleSubmitError(error);
    } finally {
      this.isSubmitting = false;
    }
  }

  private async createAdmin(): Promise<void> {
    const formData: CreateAdminArgs = {
      name: this.adminForm.value.name,
      email: this.adminForm.value.email,
      phone: this.adminForm.value.phone || undefined,
      roleLevel: this.adminForm.value.roleLevel,
      managerId: this.adminForm.value.managerId || undefined,
      zone: this.selectedZone() || undefined,
      district: this.selectedDistrict() || undefined,
      subdistrict: this.selectedSubdistrict() || undefined,
      localBody: this.selectedLocalBody() || undefined,
      ward: this.selectedWard() || undefined,
    };

    console.log('🚀 Creating admin:', formData);

    const result = await this.userService.createAdminUser(formData);

    if (result.success && result.setupLink) {
      this.setupLink = result.setupLink;
      this.showSuccess('Success', 'Admin account created successfully!');
      this.adminForm.reset();
      this.resetHierarchyFields();
    }
  }

  private async updateAdmin(): Promise<void> {
    const updateData: any = {
      userId: this.adminId!,
      name: this.adminForm.value.name,
      phone: this.adminForm.value.phone || undefined,
      roleLevel: this.adminForm.value.roleLevel,
      zone: this.selectedZone() || undefined,
      district: this.selectedDistrict() || undefined,
      subdistrict: this.selectedSubdistrict() || undefined,
      localBody: this.selectedLocalBody() || undefined,
      ward: this.selectedWard() || undefined,
    };

    console.log('🚀 Updating admin:', updateData);

    const result = await this.userService.updateAdminUser(updateData);

    if (result.success) {
      this.showSuccess('Success', 'Admin account updated successfully!');
      this.router.navigate(['/user-management/admins']);
    }
  }

  private handleSubmitError(error: any): void {
    const errorPatterns = {
      email: { summary: 'Duplicate Email', detail: 'An admin with this email address already exists' },
      phone: { summary: 'Duplicate Phone', detail: 'An admin with this phone number already exists' },
    };

    const errorMessage = error.message?.toLowerCase() || '';
    const matchedError = Object.entries(errorPatterns).find(([key]) => 
      errorMessage.includes(key)
    );

    if (matchedError) {
      const [, { summary, detail }] = matchedError;
      this.showError(summary, detail);
    } else {
      this.showError('Error', error.message || 'Failed to process request');
    }
  }

  private showError(summary: string, detail: string, life = 6000): void {
    this.messageService.add({ severity: 'error', summary, detail, life });
    this.formError.set(detail);
  }

  private showWarning(summary: string, detail: string, life = 5000): void {
    this.messageService.add({ severity: 'warn', summary, detail, life });
  }

  private showSuccess(summary: string, detail: string, life = 5000): void {
    this.messageService.add({ severity: 'success', summary, detail, life });
  }

  getRequiredFieldsHint(): string {
    const roleLevel = this.currentRoleLevel();
    if (!roleLevel) return '';
    
    const requirements = this.ROLE_HIERARCHY_REQUIREMENTS[roleLevel as keyof typeof this.ROLE_HIERARCHY_REQUIREMENTS];
    if (!requirements) return '';
    
    const requiredFields = Object.entries(requirements)
      .filter(([_, required]) => required)
      .map(([field]) => field.charAt(0).toUpperCase() + field.slice(1));
    
    if (requiredFields.length === 0) return '';
    
    return `Required: ${requiredFields.join(', ')}`;
  }

  isFieldRequired(field: 'zone' | 'district' | 'subdistrict' | 'localBody' | 'ward'): boolean {
    const roleLevel = this.currentRoleLevel();
    if (!roleLevel) return false;
    
    const requirements = this.ROLE_HIERARCHY_REQUIREMENTS[roleLevel as keyof typeof this.ROLE_HIERARCHY_REQUIREMENTS];
    return requirements?.[field] || false;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.adminForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  copySetupLink(input: HTMLInputElement): void {
    input.select();
    document.execCommand('copy');
    this.messageService.add({
      severity: 'success',
      summary: 'Copied',
      detail: 'Setup link copied to clipboard',
      life: 3000,
    });
  }

  onCancel(): void {
    if (this.isEditMode) {
      this.router.navigate(['/user-management/admins']);
    } else {
      this.adminForm.reset();
      this.resetHierarchyFields();
      this.setupLink = '';
    }
  }
}