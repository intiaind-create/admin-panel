import { Injectable } from '@angular/core';
import { ConvexService } from 'src/app/core/services/convex.service';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
export interface JobPosting {
  _id: Id<'job_postings'>;
  _creationTime: number;
  title: string;
  description: string;
  location: string;
  rootId: string;
  hierarchyId: Id<'hierarchies'>;
  hierarchyPath: string;
  wardId?: string;
  isBlanketed: boolean;
  targetWards?: string[];
  employmentType: 'full_time' | 'part_time' | 'contract';
  salaryMin: number;
  salaryMax: number;
  isActive: boolean;
   jobLevel: string;   
  postedBy: Id<'admin_users'>;
  applicationDeadline: number;
  totalApplications: number;
  shortlistedCount: number;
  createdAt: number;
  updatedAt: number;
  isDeleted: boolean;
  posterName?: string; // Enriched field
  requirements?: string[]; // Enriched field
}
interface CreateJobData {
    title: string;
    description: string;
    requirements: string[];
    location: string;
    employmentType: 'full_time' | 'part_time' | 'contract';
    salaryMin: number;
    salaryMax: number;
    applicationDeadline: number;
       jobLevel: string;   

    // ✅ REQUIRED: Geographic fields
    zone: string;
    district: string;
    
    // ✅ OPTIONAL: Additional geographic fields
    subdistrict?: string;
    localBody?: string;
    ward?: string;
    
    // Legacy/optional fields
    hierarchyId?: Id<'hierarchies'>;
    wardId?: string;
    isBlanketed?: boolean;
    targetWards?: string[];
}

@Injectable({ providedIn: 'root' })
export class JobsService {
  constructor(private convex: ConvexService) {}

  /**
   * Get all jobs with pagination
   */
  async getJobs(numItems: number = 50, cursor: string | null = null, isActive?: boolean) {
    return this.convex.client.query(api.hr.jobs.listJobs, {
      paginationOpts: {
        numItems,
        cursor: cursor || null,
      },
      isActive,
    });
  }

  /**
   * Get single job details
   */
  async getJobById(jobId: Id<'job_postings'>) {
    return this.convex.client.query(api.hr.jobs.getJob, { jobId });
  }

  /**
   * Create new job
   */
async createJob(jobData: CreateJobData) {
  const payload = {
    title: jobData.title,
    description: jobData.description,
    requirements: jobData.requirements,
    location: jobData.location,
    employmentType: jobData.employmentType,
    salaryMin: jobData.salaryMin,
    salaryMax: jobData.salaryMax,
    applicationDeadline: jobData.applicationDeadline,

    // ✅ required by backend
    jobLevel: jobData.jobLevel,

    // geographic
    zone: jobData.zone,
    district: jobData.district,
    subdistrict: jobData.subdistrict,
    localBody: jobData.localBody,
    ward: jobData.ward,

    // legacy / targeting
    hierarchyId: jobData.hierarchyId,
    wardId: jobData.wardId,
    isBlanketed: jobData.isBlanketed ?? false,
    targetWards: jobData.targetWards ?? [],
  };

  return this.convex.client.mutation(api.hr.jobs.createJob, payload);
}


  /**
   * Update existing job
   */
  async updateJob(
    jobId: Id<'job_postings'>,
    updates: Partial<{
      title: string;
      description: string;
      requirements: string[];
      location: string;
      employmentType: 'full_time' | 'part_time' | 'contract';
      salaryMin: number;
      salaryMax: number;
      applicationDeadline: number;
      isActive: boolean;
    }>
  ) {
    return this.convex.client.mutation(api.hr.jobs.updateJob, {
      jobId,
      ...updates,
    });
  }

  /**
   * Delete job (soft delete)
   */
  async deleteJob(jobId: Id<'job_postings'>) {
    return this.convex.client.mutation(api.hr.jobs.deleteJob, { jobId });
  }

  /**
   * Get job statistics
   */
  async getJobStats() {
    return this.convex.client.query(api.hr.jobs.getJobStats, {});
  }
}
