import { Injectable, signal, computed, inject } from '@angular/core';
import { ConvexService } from 'src/app/core/services/convex.service';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { CandidateCard, PipelineStage, ApplicationStatus, JobOption } from '../types/pipeline.types';
import { Subject } from 'rxjs';
import { AuthService } from '@/core/services/auth.service';

@Injectable({ providedIn: 'root' })
export class PipelineService {
  // Reactive state
  private _stages = signal<PipelineStage[]>([]);
  private _loading = signal(false);
  private _selectedJob = signal<Id<'job_postings'> | null>(null);

  // Computed values for template
  stages = computed(() => this._stages());
  loading = computed(() => this._loading());
  selectedJob = computed(() => this._selectedJob());
  private auth = inject(AuthService);

  // Card selection for detail sidebar
  selectedCard$ = new Subject<{ card: CandidateCard; stageId: ApplicationStatus }>();

  constructor(private convex: ConvexService) {}

  /**
   * Load pipeline data for selected job
   */
  async loadPipeline(jobPostingId: Id<'job_postings'>): Promise<void> {
    console.log('🔍 [PipelineService] loadPipeline called for job:', jobPostingId);
    this._loading.set(true);
    this._selectedJob.set(jobPostingId);

    try {
      const statuses: ApplicationStatus[] = [
        'applied',
        'shortlisted',
        'interviewed',
        'selected',
        'rejected',
      ];

      const PAGE_SIZE = 30;

      // ✅ Load first page for all stages in parallel
      const results = await Promise.all(
        statuses.map((status) =>
          this.convex.client.query(api.hr.pipeline.getStagePage, {
            jobPostingId,
            status,
            paginationOpts: {
              numItems: PAGE_SIZE,
              cursor: null,
            },
          })
        )
      );

      const stages: PipelineStage[] = results.map((res:any, idx:number) => {
        const status = statuses[idx];
        return {
          stageId: status,
          title: this.formatStageTitle(status),
          candidates: res.page,
          nextCursor: res.continueCursor,
          isDone: res.isDone,
          totalCount: res.totalCount,
        };
      });

      this._stages.set(stages);
      console.log('✅ [PipelineService] Paged pipeline loaded:', stages);
    } catch (error) {
      console.error('❌ [PipelineService] loadPipeline failed:', error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  private formatStageTitle(status: ApplicationStatus): string {
    const titles: Record<ApplicationStatus, string> = {
      applied: 'Applied',
      shortlisted: 'Shortlisted',
      interviewed: 'Interviewed',
      selected: 'Selected',
      rejected: 'Rejected',
    };
    return titles[status];
  }

  async loadMoreForStage(
    jobPostingId: Id<'job_postings'>,
    stageId: ApplicationStatus
  ): Promise<void> {
    const currentStages = this._stages();
    const stageIndex = currentStages.findIndex((s) => s.stageId === stageId);
    if (stageIndex === -1) return;

    const stage = currentStages[stageIndex];

    if (stage.isDone || !stage.nextCursor) {
      return; // Nothing more to load
    }

    const PAGE_SIZE = 30;

    try {
      const res = await this.convex.client.query(api.hr.pipeline.getStagePage, {
        jobPostingId,
        status: stageId,
        paginationOpts: {
          numItems: PAGE_SIZE,
          cursor: stage.nextCursor,
        },
      });

      const updatedStage: PipelineStage = {
        ...stage,
        candidates: [...stage.candidates, ...res.page],
        nextCursor: res.continueCursor,
        isDone: res.isDone,
        totalCount: res.totalCount,
      };

      const updatedStages = [...currentStages];
      updatedStages[stageIndex] = updatedStage;
      this._stages.set(updatedStages);
    } catch (error) {
      console.error('❌ [PipelineService] loadMoreForStage failed:', error);
      throw error;
    }
  }

  /**
   * Move candidate to new stage with workflow validation
   */
  async moveCandidate(
    applicationId: Id<'job_applications'>,
    newStatus: ApplicationStatus,
    rejectionReason?: string,
    interviewNotes?: string
  ): Promise<void> {
    try {
      // ✅ FIXED: Use hr/pipeline (not hr/applications)
      await this.convex.client.mutation(
        api.hr.pipeline.moveApplicationStage,  // ✅ Changed from applications to pipeline
        {
          applicationId,
          newStatus,
          rejectionReason,
          interviewNotes,
        }
      );

      // Reload pipeline after move
      const selectedJob = this._selectedJob();
      if (selectedJob) {
        await this.loadPipeline(selectedJob);
      }
    } catch (error: any) {
      console.error('Failed to move candidate:', error);
      throw new Error(error.message || 'Failed to move candidate');
    }
  }

  /**
   * Get available jobs for filter dropdown
   */
  async getAvailableJobs(): Promise<JobOption[]> {
    console.log('🔍 [PipelineService] getAvailableJobs() called');
    const user = this.auth.currentUser(); // signal read
    const rootId = user?.rootId;

    if (!rootId) {
      console.error(
        '[PipelineService] No rootId on current user. Is profile loaded / logged in?',
      );
      return [];
    }
    // ✅ CORRECT: Use hr/pipeline.getJobsForPipeline
    const result = await this.convex.query(
      api.hr.pipeline.getJobsForPipeline,
      { rootId }
    );

    console.log('✅ [PipelineService] Jobs returned:', result);
    return result as JobOption[];
  }

  /**
   * Trigger card selection (opens detail sidebar)
   */
  onCardSelect(card: CandidateCard, stageId: ApplicationStatus): void {
    this.selectedCard$.next({ card, stageId });
  }

  /**
   * Assign application to ward (for blanket jobs)
   */
  async assignToWard(
    applicationId: Id<'job_applications'>,
    wardId: string
  ): Promise<void> {
    // ✅ Use hr/pipeline version
    await this.convex.client.mutation(
      api.hr.pipeline.assignApplicationToWard,
      {
        applicationId,
        wardId,
      }
    );

    // Reload pipeline
    const selectedJob = this._selectedJob();
    if (selectedJob) {
      await this.loadPipeline(selectedJob);
    }
  }

  // ✅ Use wards.ts API endpoints directly
  async getZones() {
    return this.convex.client.query(api.wards.getZones, {});
  }

  async getDistricts(zone?: string) {
    return this.convex.client.query(api.wards.getDistricts, { zone });
  }

  async getSubdistricts(zone?: string, district?: string) {
    return this.convex.client.query(api.wards.getSubdistricts, { zone, district });
  }

  async getLocalBodies(zone?: string, district?: string, subdistrict?: string) {
    return this.convex.client.query(api.wards.getLocalBodies, { 
      zone, district, subdistrict 
    });
  }

  async getLocalBodyTypes() {
    return this.convex.client.query(api.wards.getLocalBodyTypes, {});
  }

  async getWards(zone?: string, district?: string, subdistrict?: string, localBodyName?: string) {
    return this.convex.client.query(api.wards.getWards, { 
      zone, district, subdistrict, localBodyName 
    });
  }

  async searchWards(query: string) {
    return this.convex.client.query(api.wards.searchWards, { 
      searchTerm: query, 
      limit: 20 
    });
  }

  /**
   * ✅ FIXED: Complete convertApplicationToUser with correct userType logic
   */
  async convertApplicationToUser(
    applicationId: Id<'job_applications'>,
    jobTitle: string
  ): Promise<{ success: boolean; setupLink: string; userType: string; assignedWardIds?: string[] }> {
    console.log('🔄 PipelineService.convertApplicationToUser called:', { applicationId, jobTitle });
    
    // ✅ STEP 1: Get caller profile FIRST
    const profile = await this.convex.client.query(api.auth.getCurrentUserProfile, {});
    console.log('🔍 Caller profile:', profile?.roleLevel, profile?.name);
    
    if (!profile || profile.roleLevel < 5) {
      throw new Error('Permission Denied: Insufficient role level');
    }
    
    // ✅ STEP 2: PERFECT userType determination from auto-filled job title
    const userType = this.determineUserTypeFromJobTitle(jobTitle);
    
    console.log('🎯 Determined userType:', userType, 'from jobTitle:', jobTitle);
    
    // ✅ STEP 3: Get active managers for assignment
    const managersResult = await this.convex.client.query(
      api.users.admin.queries.listAdmins, 
      {
        isActive: true,
        paginationOpts: { numItems: 5, cursor: null } as any
      }
    ) as any;
    
    const managers = managersResult.page || [];
    
    if (managers.length === 0) {
      throw new Error('No active managers found. Please assign a manager first.');
    }
    
    // ✅ STEP 4: Manager assignment based on userType
    let managerId: Id<'admin_users'>;
    if (userType === 'executive') {
      // Find District Manager (roleLevel 6) for executives
      const districtManager = managers.find((m: any) => m.roleLevel === 6);
      managerId = (districtManager?._id as Id<'admin_users'>) || (managers[0]._id as Id<'admin_users'>);
      console.log('👤 Executive detected - using District Manager:', managerId);
    } else {
      // For admins, use first available manager
      managerId = managers[0]._id as Id<'admin_users'>;
      console.log('👤 Admin detected - using first available manager:', managerId);
    }
    
    // ✅ STEP 5: Call backend mutation with CORRECT userType
    const result = await this.convex.client.mutation(api.hr.applications.convertApplicationToUser, {
      applicationId,
      userType,
      managerId,
      jobTitle,
      roleLevel: userType === 'admin' ? 6 : undefined,
      hierarchyId: undefined,
      callerProfile: profile
    });
    
    console.log('✅ User creation result:', result);
    return result;
  }

  /**
   * ✅ PERFECT: Determine userType from job title/level (auto-filled from jobLevel)
   * Based on ROLE_LEVELS enum from your system
   */
  private determineUserTypeFromJobTitle(jobTitle: string): 'executive' | 'admin' {
    const titleUpper = jobTitle.toUpperCase().replace(/\s+/g, '_');
    
    // ✅ Define which roles are executives vs admins based on ROLE_LEVELS
    const executiveRoles = [
      'EXECUTIVE',           // This is the actual executive role (level 2)
    ];
    
    const adminRoles = [
      'WARD_MANAGER',
      'WARD_TEAM_LEADER',
      'LOCAL_BODY_MANAGER', 
      'SUBDISTRICT_MANAGER',
      'DISTRICT_MANAGER',
      'ZONAL_MANAGER',
      'STATE_HEAD',
      'SUPER_ADMIN'
    ];
    
    // Check if it's an executive role
    if (executiveRoles.some(role => titleUpper.includes(role))) {
      return 'executive';
    }
    
    // Check if it's an admin role
    if (adminRoles.some(role => titleUpper.includes(role))) {
      return 'admin';
    }
    
    // ✅ FALLBACK: If title contains "executive" as standalone word, it's executive
    const words = jobTitle.toLowerCase().split(/\s+/);
    if (words.includes('executive') && !words.includes('manager') && !words.includes('admin')) {
      return 'executive';
    }
    
    // Default to admin for safety (managers should be admins)
    console.warn('⚠️ Unknown job title, defaulting to admin:', jobTitle);
    return 'admin';
  }
}
