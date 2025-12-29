import { Injectable, inject } from '@angular/core';
import { ConvexService } from 'src/app/core/services/convex.service';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';

export type PublicFileType = 'resume' | 'idCard';

export interface PublicApplicationPayload {
  jobPostingId: Id<'job_postings'>;

  // Personal Details
  name: string;
  email: string;
  phone: string;
  experience: number;

  // ✅ NEW: Demographic Fields
  guardianName?: string;
  dateOfBirth?: string; // ISO date string (YYYY-MM-DD)
  age?: string; // "25 years"
  sex?: string; // Male/Female/Other
  alternatePhone?: string;
  qualification?: string; // 10th Pass, Graduate, etc.
  idType?: string; // Voter ID, Aadhaar, Driving License

  // Location
  zone?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  localBodyName?: string | null;
  localBodyType?: string | null;
  wardId?: string | null;
  wardName?: string | null;

  // Files
  resumeId: Id<'_storage'>;
  idCardId: Id<'_storage'>;

  source?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PublicApplicationService {
  private convex = inject(ConvexService);

  /**
   * List all active job postings (public-facing)
   */
  async listPublicJobs() {
    return this.convex.client.query(api.hr.jobs.listActiveJobs, {});
  }

  /**
   * Upload a single file (resume or ID card) to Convex storage.
   * Returns the storageId to be passed into submitPublicApplication.
   */
  async uploadFile(file: File): Promise<Id<'_storage'>> {
    const uploadUrl = await this.convex.client.mutation(api.files.generateUploadUrl, {});

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const { storageId } = await response.json();
    return storageId as Id<'_storage'>;
  }

  /**
   * Submit a public application for a given job.
   * Assumes files are already uploaded and you have their storage IDs.
   */
  async submitApplication(payload: PublicApplicationPayload) {
    const {
      jobPostingId,
      name,
      email,
      phone,
      experience,
      
      // ✅ NEW: Demographic fields
      guardianName,
      dateOfBirth,
      age,
      sex,
      alternatePhone,
      qualification,
      idType,
      
      // Location
      zone,
      district,
      subdistrict,
      localBodyName,
      localBodyType,
      wardId,
      wardName,
      
      // Files
      resumeId,
      idCardId,
      source,
    } = payload;

    return this.convex.client.mutation(
      api.hr.applications.submitPublicApplication,
      {
        jobPostingId,
        name,
        email,
        phone,
        experience,
        
        // ✅ NEW: Pass demographic fields
        guardianName: guardianName || undefined,
        dateOfBirth: dateOfBirth || undefined,
        age: age || undefined,
        sex: sex || undefined,
        alternatePhone: alternatePhone || undefined,
        qualification: qualification || undefined,
        idType: idType || undefined,
        
        // Location
        zone: zone || undefined,
        district: district || undefined,
        subdistrict: subdistrict || undefined,
        localBodyName: localBodyName || undefined,
        localBodyType: localBodyType || undefined,
        wardId: wardId || undefined,
        wardName: wardName || undefined,
        
        // Files
        resumeId,
        idCardId,
        source: source || 'public_form',
      }
    );
  }

  /**
   * Fetch minimal job info to show on the public form
   */
  async getJobSummary(jobPostingId: Id<'job_postings'>) {
    return this.convex.client.query(api.hr.jobs.getJob, { jobId: jobPostingId });
  }
}