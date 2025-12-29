import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    FormGroup,
    Validators,
    ReactiveFormsModule,
    FormsModule,
    AbstractControl,
    ValidationErrors
} from '@angular/forms';
import { Router } from '@angular/router';

import {
    PublicApplicationService,
    PublicFileType
} from '../services/public-application.service';
import { Id } from 'convex/_generated/dataModel';
import { MessageService } from 'primeng/api';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { FileUploadHandlerEvent, FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DatePipe } from '@angular/common';
import { PipelineService } from '../../candidate-pipeline/services/pipeline.service';
import { TagModule } from 'primeng/tag';
import { DatePicker } from 'primeng/datepicker';

interface PublicJobOption {
    _id: Id<'job_postings'>;
    title: string;
    location: string;
    employmentType: 'full_time' | 'part_time' | 'contract';
    applicationDeadline: number;
    isBlanketed: boolean;
    wardId?: string;
    targetWards?: string[];
    zone?: string;
    district?: string;
    subdistrict?: string;
}

// ✅ Phone validator (10 digits)
function phoneValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(control.value) ? null : { invalidPhone: true };
}

@Component({
    selector: 'app-public-application-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ButtonModule,
        InputTextModule,
        InputNumberModule,
        SelectModule,
        FileUploadModule,
        ToastModule,
        CardModule,
        DividerModule,
        FormsModule,
        TagModule,
        DatePicker
    ],
    templateUrl: './public-application-form.component.html',
    styleUrls: ['./public-application-form.component.scss'],
    providers: [MessageService]
})
export class PublicApplicationFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private publicAppService = inject(PublicApplicationService);
    private messageService = inject(MessageService);
    private router = inject(Router);
    private pipelineService = inject(PipelineService);

    // Data signals
    zones = signal<{ label: string; value: string }[]>([]);
    districts = signal<{ label: string; value: string }[]>([]);
    subdistricts = signal<{ label: string; value: string }[]>([]);
    localBodies = signal<{ label: string; value: string }[]>([]);
    wards = signal<{ label: string; value: string }[]>([]);
    jobs = signal<PublicJobOption[]>([]);

    // Loading states
    loadingJobs = signal(false);
    loadingZones = signal(false);
    loadingDistricts = signal(false);
    loadingSubdistricts = signal(false);
    loadingLocalBodies = signal(false);
    loadingWards = signal(false);

    // UI states
    submitting = signal(false);
    uploadingResume = signal(false);
    uploadingIdCard = signal(false);

    // Selected values
    selectedJobId = signal<Id<'job_postings'> | null>(null);
    resumeId = signal<Id<'_storage'> | null>(null);
    idCardId = signal<Id<'_storage'> | null>(null);
    resumeFileName = signal<string>('');
    idCardFileName = signal<string>('');

    form!: FormGroup;

    // ✅ Dropdown options
    sexOptions = [
        { label: 'Male / പുരുഷൻ', value: 'Male' },
        { label: 'Female / സ്ത്രീ', value: 'Female' },
        { label: 'Other / മറ്റുള്ളവ', value: 'Other' }
    ];

    qualificationOptions = [
        { label: '10th Pass / 10-ാം ക്ലാസ് പാസ്', value: '10th Pass' },
        { label: '12th Pass / 12-ാം ക്ലാസ് പാസ്', value: '12th Pass' },
        { label: 'Diploma / ഡിപ്ലോമ', value: 'Diploma' },
        { label: 'Graduate (Bachelor\'s) / ബിരുദം', value: 'Graduate' },
        { label: 'Post Graduate (Master\'s) / ബിരുദാനന്തര ബിരുദം', value: 'Post Graduate' },
        { label: 'Other / മറ്റുള്ളവ', value: 'Other' }
    ];

    idTypeOptions = [
        { label: 'Voter ID / വോട്ടർ ഐഡി', value: 'Voter ID' },
        { label: 'Aadhaar Card / ആധാർ കാർഡ്', value: 'Aadhaar Card' },
        { label: 'Driving License / ഡ്രൈവിംഗ് ലൈസൻസ്', value: 'Driving License' }
    ];

    // ✅ Max date for DOB (must be 18 years old)
    maxDate = new Date();

    // Computed signals
    selectedJob = computed(() =>
        this.jobs().find((j) => j._id === this.selectedJobId()) || null
    );

    showForm = computed(() => !!this.selectedJobId());

    requiresWard = computed(() => {
        const job = this.selectedJob();
        return !!(job?.wardId || (job?.targetWards && job.targetWards.length > 0));
    });

    constructor() {
        // Set max date to 18 years ago
        this.maxDate.setFullYear(this.maxDate.getFullYear() - 18);
    }

    async ngOnInit() {
        this.initForm();
        await this.loadJobs();
        await this.loadZones();
    }

    private initForm() {
        this.form = this.fb.group({
            jobPostingId: [null, Validators.required],
            
            // Personal Details
            name: ['', [Validators.required, Validators.minLength(3)]],
            guardianName: ['', Validators.required],
            dateOfBirth: [null, Validators.required],
            age: [{ value: '', disabled: true }],
            sex: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            phone: ['', [Validators.required, phoneValidator]],
            alternatePhone: ['', phoneValidator],
            
            // Qualification & ID
            qualification: ['', Validators.required],
            idType: ['', Validators.required],
            experience: [0, [Validators.required, Validators.min(0)]],
            
            // Location
            zone: [''],
            district: [''],
            subdistrict: [''],
            localBodyName: [''],
            localBodyType: [''],
            wardId: [''],
            wardName: [''],
        });

        // ✅ Auto-calculate age when DOB changes
        this.form.get('dateOfBirth')?.valueChanges.subscribe(dob => {
            if (dob) {
                const age = this.calculateAge(dob);
                this.form.patchValue({ age: `${age} years` }, { emitEvent: false });
            }
        });
    }

    // ✅ Calculate age from date of birth
    private calculateAge(dob: Date): number {
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        return age;
    }

    // ====================================================================
    // JOB SELECTION
    // ====================================================================

    async loadJobs() {
        this.loadingJobs.set(true);
        try {
            const result = await this.publicAppService.listPublicJobs();
            this.jobs.set((result as PublicJobOption[]) || []);
        } catch (error: any) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: error.message || 'Failed to load jobs',
            });
        } finally {
            this.loadingJobs.set(false);
        }
    }

    onJobChange(jobId: Id<'job_postings'> | null) {
        this.selectedJobId.set(jobId);
        this.form.patchValue({ jobPostingId: jobId });
        this.resetLocationFields();
    }

    private resetLocationFields() {
        this.form.patchValue({
            zone: '',
            district: '',
            subdistrict: '',
            localBodyName: '',
            localBodyType: '',
            wardId: '',
            wardName: '',
        });
        this.districts.set([]);
        this.subdistricts.set([]);
        this.localBodies.set([]);
        this.wards.set([]);
    }

    employmentTypeLabel(type: string): string {
        const map: Record<string, string> = {
            full_time: 'Full-time',
            part_time: 'Part-time',
            contract: 'Contract',
        };
        return map[type] || type;
    }

    formatDeadline(deadline: number): string {
        return new Date(deadline).toLocaleDateString('en-GB');
    }

    // ====================================================================
    // FILE UPLOADS
    // ====================================================================

    async onFileSelect(event: FileUploadHandlerEvent, type: PublicFileType) {
        const file: File | undefined = event.files?.[0];
        if (!file) return;

        // ✅ Validate file size
        const maxSize = type === 'resume' ? 2 * 1024 * 1024 : 1 * 1024 * 1024; // 2MB resume, 1MB ID
        if (file.size > maxSize) {
            this.messageService.add({
                severity: 'error',
                summary: 'File Too Large',
                detail: `File size must be less than ${type === 'resume' ? '2MB' : '1MB'}`,
            });
            return;
        }

        // ✅ Validate file type
        const allowedTypes = type === 'resume' 
            ? ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
            : ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        
        if (!allowedTypes.includes(file.type)) {
            this.messageService.add({
                severity: 'error',
                summary: 'Invalid File Type',
                detail: type === 'resume' 
                    ? 'Please upload PDF, DOC, or DOCX file' 
                    : 'Please upload JPG, PNG, or PDF file',
            });
            return;
        }

        const loadingSignal = type === 'resume' ? this.uploadingResume : this.uploadingIdCard;
        loadingSignal.set(true);

        try {
            const storageId = await this.publicAppService.uploadFile(file);
            
            if (type === 'resume') {
                this.resumeId.set(storageId);
                this.resumeFileName.set(file.name);
            } else {
                this.idCardId.set(storageId);
                this.idCardFileName.set(file.name);
            }

            this.messageService.add({
                severity: 'success',
                summary: 'Uploaded',
                detail: `${type === 'resume' ? 'Resume' : 'ID card'} uploaded successfully`,
            });
        } catch (error: any) {
            this.messageService.add({
                severity: 'error',
                summary: 'Upload Failed',
                detail: error.message || 'Could not upload file',
            });
        } finally {
            loadingSignal.set(false);
        }
    }

    // ✅ Clear uploaded file
    clearFile(type: PublicFileType) {
        if (type === 'resume') {
            this.resumeId.set(null);
            this.resumeFileName.set('');
        } else {
            this.idCardId.set(null);
            this.idCardFileName.set('');
        }
    }

    // ====================================================================
    // FORM SUBMISSION
    // ====================================================================

    async onSubmit() {
        // Validate form
        if (!this.form.valid) {
            this.form.markAllAsTouched();
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Please fill all required fields correctly',
            });
            return;
        }

        // Validate job selected
        const jobId = this.selectedJobId();
        if (!jobId) {
            this.messageService.add({
                severity: 'warn',
                summary: 'No Job Selected',
                detail: 'Please select a job to apply for',
            });
            return;
        }

        // Validate files uploaded
        const resume = this.resumeId();
        const idCard = this.idCardId();
        if (!resume || !idCard) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Files Required',
                detail: 'Please upload both resume and ID card',
            });
            return;
        }

        // Check if ward is required
        const value = this.form.getRawValue();
        if (this.requiresWard() && !value.wardId) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Ward Required',
                detail: 'Please select your ward to apply for this job',
            });
            return;
        }

        this.submitting.set(true);
        try {
            await this.publicAppService.submitApplication({
                jobPostingId: jobId,
                name: value.name,
                email: value.email,
                phone: value.phone,
                experience: value.experience,
                
                // ✅ New fields
                guardianName: value.guardianName,
                dateOfBirth: value.dateOfBirth ? new Date(value.dateOfBirth).toISOString().split('T')[0] : undefined,
                age: value.age,
                sex: value.sex,
                alternatePhone: value.alternatePhone || undefined,
                qualification: value.qualification,
                idType: value.idType,
                
                // Location
                zone: value.zone || undefined,
                district: value.district || undefined,
                subdistrict: value.subdistrict || undefined,
                localBodyName: value.localBodyName || undefined,
                localBodyType: value.localBodyType || undefined,
                wardId: this.requiresWard() ? value.wardId || undefined : undefined,
                wardName: this.requiresWard() ? value.wardName || undefined : undefined,
                
                // Files
                resumeId: resume,
                idCardId: idCard,
                source: 'public_form',
            });

            this.messageService.add({
                severity: 'success',
                summary: 'Application Submitted',
                detail: 'Thank you for applying! Your application has been received.',
                life: 5000
            });

            // Reset form after 2 seconds
            setTimeout(() => this.resetForm(), 2000);
            
        } catch (error: any) {
            this.messageService.add({
                severity: 'error',
                summary: 'Submission Failed',
                detail: error.message || 'Could not submit application',
            });
        } finally {
            this.submitting.set(false);
        }
    }

    resetForm() {
        this.form.reset();
        this.selectedJobId.set(null);
        this.resumeId.set(null);
        this.idCardId.set(null);
        this.resumeFileName.set('');
        this.idCardFileName.set('');
        this.resetLocationFields();
        this.form.patchValue({ experience: 0 });
    }

    // ====================================================================
    // LOCATION CASCADING
    // ====================================================================

    async loadZones() {
        this.loadingZones.set(true);
        try {
            const res = await this.pipelineService.getZones();
            this.zones.set(res);
        } catch (e) {
            console.error('Failed to load zones', e);
        } finally {
            this.loadingZones.set(false);
        }
    }

    async loadDistricts() {
        const zone = this.form.value.zone;
        if (!zone) return;

        this.loadingDistricts.set(true);
        try {
            const res = await this.pipelineService.getDistricts(zone);
            this.districts.set(res);
        } catch (e) {
            console.error('Failed to load districts', e);
        } finally {
            this.loadingDistricts.set(false);
        }
    }

    async loadSubdistricts() {
        const zone = this.form.value.zone;
        const district = this.form.value.district;
        if (!zone || !district) return;

        this.loadingSubdistricts.set(true);
        try {
            const res = await this.pipelineService.getSubdistricts(zone, district);
            this.subdistricts.set(res);
        } catch (e) {
            console.error('Failed to load subdistricts', e);
        } finally {
            this.loadingSubdistricts.set(false);
        }
    }

    async loadLocalBodies() {
        const zone = this.form.value.zone;
        const district = this.form.value.district;
        const subdistrict = this.form.value.subdistrict;
        if (!zone || !district || !subdistrict) return;

        this.loadingLocalBodies.set(true);
        try {
            const res = await this.pipelineService.getLocalBodies(zone, district, subdistrict);
            this.localBodies.set(res);
        } catch (e) {
            console.error('Failed to load local bodies', e);
        } finally {
            this.loadingLocalBodies.set(false);
        }
    }

    async loadWards() {
        const zone = this.form.value.zone;
        const district = this.form.value.district;
        const subdistrict = this.form.value.subdistrict;
        const localBodyName = this.form.value.localBodyName;
        if (!zone || !district || !subdistrict || !localBodyName) return;

        this.loadingWards.set(true);
        try {
            const res = await this.pipelineService.getWards(zone, district, subdistrict, localBodyName);
            this.wards.set(res);
        } catch (e) {
            console.error('Failed to load wards', e);
        } finally {
            this.loadingWards.set(false);
        }
    }

    // Location change handlers
    onZoneChange(event: any) {
        this.form.patchValue({
            zone: event.value,
            district: '',
            subdistrict: '',
            localBodyName: '',
            wardId: '',
            wardName: '',
        });
        this.districts.set([]);
        this.subdistricts.set([]);
        this.localBodies.set([]);
        this.wards.set([]);
        this.loadDistricts();
    }

    onDistrictChange(event: any) {
        this.form.patchValue({
            district: event.value,
            subdistrict: '',
            localBodyName: '',
            wardId: '',
            wardName: '',
        });
        this.subdistricts.set([]);
        this.localBodies.set([]);
        this.wards.set([]);
        this.loadSubdistricts();
    }

    onSubdistrictChange(event: any) {
        this.form.patchValue({
            subdistrict: event.value,
            localBodyName: '',
            wardId: '',
            wardName: '',
        });
        this.localBodies.set([]);
        this.wards.set([]);
        this.loadLocalBodies();
    }

    onLocalBodyChange(event: any) {
        this.form.patchValue({
            localBodyName: event.value,
            wardId: '',
            wardName: '',
        });
        this.wards.set([]);
        this.loadWards();
    }

    onWardChange(event: any) {
        const selected = this.wards().find((w) => w.value === event.value);
        this.form.patchValue({
            wardId: event.value,
            wardName: selected?.label || '',
        });
    }

    // ====================================================================
    // HELPERS
    // ====================================================================

    isFieldInvalid(field: string): boolean {
        const control = this.form.get(field);
        return !!(control && control.invalid && (control.dirty || control.touched));
    }

    getFieldError(field: string): string {
        const control = this.form.get(field);
        if (!control || !control.errors) return '';

        if (control.errors['required']) return 'This field is required';
        if (control.errors['email']) return 'Invalid email address';
        if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} characters required`;
        if (control.errors['invalidPhone']) return 'Must be a valid 10-digit phone number';
        if (control.errors['min']) return `Minimum value is ${control.errors['min'].min}`;

        return 'Invalid value';
    }
}
