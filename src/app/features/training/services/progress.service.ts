// src/app/services/progress.service.ts
import { ConvexService } from '@/core/services/convex.service';
import { Injectable, signal } from '@angular/core';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import {
    PaginatedProgress,
    TrainingProgress
} from '../interfaces/training.interface';

@Injectable({
    providedIn: 'root'
})
export class ProgressService {
    loading = signal(false);

    constructor(private convex: ConvexService) {}

    /**
     * List progress with pagination and filters
     */
    // src/app/services/progress.service.ts
    async listProgress(
        numItems: number = 50,
        cursor: string | null = null,
        courseId?: Id<'training_courses'>,
        executiveId?: Id<'executives'>,
        status?: 'not_started' | 'in_progress' | 'completed' | 'failed'
    ): Promise<PaginatedProgress> {
        this.loading.set(true);
        try {
            console.log('🔍 Calling listProgress with:', {
                numItems,
                cursor,
                courseId,
                executiveId,
                status
            });

            const result = await this.convex.client.query(
                api.training.progress.listProgress,
                {
                    paginationOpts: {
                        numItems,
                        cursor: cursor || null
                    },
                    courseId,
                    executiveId,
                    status
                }
            );

            console.log('✅ Progress result:', result);
            return result as any;
        } catch (error) {
            console.error('❌ Progress query error:', error);
            throw error;
        } finally {
            this.loading.set(false);
        }
    }

    /**
     * Get detailed progress by ID
     */
    async getProgress(progressId: Id<'training_progress'>): Promise<any> {
        return await this.convex.client.query(
            api.training.progress.getProgress,
            {
                progressId
            }
        );
    }

    /**
     * Get executive's training progress
     */
    async getExecutiveProgress(
        executiveId: Id<'executives'>
    ): Promise<TrainingProgress[]> {
        return (await this.convex.client.query(
            api.training.progress.getExecutiveProgress,
            {
                executiveId
            }
        )) as any;
    }

    /**
     * Get executive training stats
     */
    async getExecutiveStats(executiveId: Id<'executives'>): Promise<any> {
        return await this.convex.client.query(
            api.training.progress.getExecutiveTrainingStats,
            {
                executiveId
            }
        );
    }

    /**
     * Enroll executive in course
     */
    async enrollExecutive(
        executiveId: Id<'executives'>,
        courseId: Id<'training_courses'>
    ): Promise<{ progressId: Id<'training_progress'>; success: boolean }> {
        return (await this.convex.client.mutation(
            api.training.progress.enrollExecutive,
            {
                executiveId,
                courseId
            }
        )) as any;
    }

    /**
     * Update module progress
     */
    async updateModuleProgress(
        moduleProgressId: Id<'training_module_progress'>,
        status: 'in_progress' | 'completed',
        timeSpentMinutes: number,
        score?: number
    ): Promise<{ success: boolean }> {
        return (await this.convex.client.mutation(
            api.training.progress.updateModuleProgress,
            {
                moduleProgressId,
                status,
                timeSpentMinutes,
                score
            }
        )) as any;
    }

    /**
     * Generate certificate
     */
generateCertificate(progressId: Id<'training_progress'>) {
  return this.convex.client.action(
    api.training.certificates.generateCertificate,
    { progressId }
  );
}

    /**
     * Get certificate URL
     */
    async getCertificateUrl(certificateId: Id<'_storage'>): Promise<string> {
        return await this.convex.client.query(
            api.training.progress.getCertificateUrl,
            {
                certificateId
            }
        );
    }
}
