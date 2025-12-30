// src/app/features/target-management/models/target.types.ts

import { Id } from 'convex/_generated/dataModel';

// ============================================================================
// TARGET TYPES
// ============================================================================

export type TargetPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly';
export type TargetStatus = 'active' | 'completed' | 'failed' | 'cancelled';

// ============================================================================
// TARGET INTERFACES
// ============================================================================

export interface Target {
    _id: Id<'targets'>;
    _creationTime: number;
    rootId: string;
    executiveId: Id<'executives'>;
    
    period: TargetPeriod;
    startDate: number;
    endDate: number;
    
    sponsorshipTarget: number;
    sponsorshipAchieved: number;
    tasksTarget: number;
    tasksCompleted: number;
    votersTarget: number;
    votersContacted: number;
    
    status: TargetStatus;
    createdBy: Id<'admin_users'>;
    createdAt: number;
    updatedAt: number;
    isDeleted: boolean;
}

export interface EnrichedTarget extends Target {
    executiveName: string;
    executiveEmployeeId: string;
    executivePhone?: string;
    createdByName: string;
    
    sponsorshipProgress: number;
    tasksProgress: number;
    votersProgress: number;
    overallProgress: number;
    isOnTrack: boolean;
    daysRemaining: number;
}

export interface CreateTargetData {
    executiveId: Id<'executives'>;
    period: TargetPeriod;
    startDate: number;
    endDate: number;
    sponsorshipTarget: number;
    tasksTarget: number;
    votersTarget: number;
}

export interface UpdateTargetData {
    sponsorshipTarget?: number;
    tasksTarget?: number;
    votersTarget?: number;
    endDate?: number;
    status?: TargetStatus;
}

export interface TargetStats {
    total: number;
    timeWindow: string;
    active: number;
    completed: number;
    failed: number;
    cancelled: number;
    
    totalSponsorshipTarget: number;
    totalSponsorshipAchieved: number;
    totalTasksTarget: number;
    totalTasksCompleted: number;
    totalVotersTarget: number;
    totalVotersContacted: number;
    
    sponsorshipAchievementRate: number;
    tasksAchievementRate: number;
    votersAchievementRate: number;
    
    onTrack: number;
    offTrack: number;
}

export interface BulkCreateResult {
    success: number;
    failed: number;
    targetIds: Id<'targets'>[];
    errors: Array<{ executiveId: Id<'executives'>; reason: string }>;
}

export interface Executive {
    _id: Id<'executives'>;
    name: string;
    email: string;
    employeeId: string;
    wardId?: string;
    wardName?: string;
    zone?: string;
    district?: string;
    hierarchyId?: Id<'hierarchies'>;
}