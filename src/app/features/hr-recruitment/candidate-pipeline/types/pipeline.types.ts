import { Id } from 'convex/_generated/dataModel';

// Backend status (5 stages)
export type ApplicationStatus =
    | 'applied'
    | 'shortlisted'
    | 'interviewed'
    | 'selected'
    | 'rejected';

export interface CandidateCard {
    id: Id<'job_applications'>;
    candidateName: string;
    email: string;
    phone: string;
    experience: number;
    appliedDate: string;
    wardId?: string;
    interviewDate?: string;
    interviewNotes?: string;
    rejectionReason?: string;
    jobTitle?: string; // ✅ Now populated from job_postings.jobLevel
    resumeUrl?: string;   
    convertedToUserId?: Id<'admin_users'> | Id<'executives'>;
    convertedAt?: number;
    // Note: userType is NOT stored in job_applications table
    // It's determined from jobTitle when converting to user
}

export interface PipelineStage {
    stageId: ApplicationStatus;
    title: string;
    candidates: CandidateCard[];

    // ✅ New for pagination
    nextCursor: string | null;
    isDone: boolean;
    totalCount: number;
}

export interface JobOption {
    value: Id<'job_postings'>;
    label: string;
    totalApplications: number;
}

export interface CandidateCardExtended extends CandidateCard {
    jobTitle: string; // from job_postings (non-optional in extended version)
}