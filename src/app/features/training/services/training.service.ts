import { Injectable } from '@angular/core';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { ConvexService } from 'src/app/core/services/convex.service';
import { Course } from '../interfaces/training.interface';

@Injectable({ providedIn: 'root' })
export class TrainingService {
  constructor(private convex: ConvexService) {}

  // ============================================================================
  // COURSE MANAGEMENT
  // ============================================================================

  async getCourses(): Promise<Course[]> {
    const result = await this.convex.client.query(api.training.courses.listCourses, {
      paginationOpts: { numItems: 100, cursor: null }
    });
    return result.page as any as Course[];
  }

  async getCourse(courseId: Id<'training_courses'>) {
    return this.convex.client.query(api.training.courses.getCourse, { courseId });
  }

  async createCourse(courseData: {
    title: string;
    description: string;
    category: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    passingScore: number;
    estimatedHours: number;
    modules: Array<{
      title: string;
      description: string;
      order: number;
      estimatedMinutes: number;
      contentType: 'video' | 'document' | 'quiz' | 'interactive';
      isRequired: boolean;
    }>;
  }) {
    return this.convex.client.mutation(api.training.courses.createCourse, courseData);
  }

  async updateCourse(
    courseId: Id<'training_courses'>,
    updates: Partial<{
      title: string;
      description: string;
      category: string;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
      passingScore: number;
      estimatedHours: number;
      isActive: boolean;
      certificateTemplateId: Id<'_storage'>;
    }>
  ) {
    return this.convex.client.mutation(api.training.courses.updateCourse, {
      courseId,
      ...updates
    });
  }

  async deleteCourse(courseId: Id<'training_courses'>) {
    return this.updateCourse(courseId, { isActive: false });
  }

  async getCourseStats() {
    return this.convex.client.query(api.training.courses.getCourseStats, {});
  }

  // ============================================================================
  // MODULE MANAGEMENT
  // ============================================================================

  async addModule(
    courseId: Id<'training_courses'>,
    moduleData: {
      title: string;
      description: string;
      estimatedMinutes: number;
      contentType: 'video' | 'document' | 'quiz' | 'interactive';
      isRequired: boolean;
    }
  ): Promise<{ moduleId: Id<'training_modules'>; success: boolean }> {
    try {
      const result = await this.convex.client.mutation(api.training.courses.addModule, {
        courseId,
        ...moduleData
      });
      console.log('✅ Module added:', result.moduleId);
      return result;
    } catch (error: any) {
      console.error('❌ Add module failed:', error);
      throw new Error(`Failed to add module: ${error.message}`);
    }
  }

  async updateModule(
    moduleId: Id<'training_modules'>,
    updates: {
      title?: string;
      description?: string;
      estimatedMinutes?: number;
      contentType?: 'video' | 'document' | 'quiz' | 'interactive';
      isRequired?: boolean;
    }
  ): Promise<{ success: boolean }> {
    try {
      const result = await this.convex.client.mutation(
        api.training.courses.updateModule as any,
        { moduleId, ...updates }
      );
      return result;
    } catch (error: any) {
      console.error('❌ Update module failed:', error);
      throw new Error(`Failed to update module: ${error.message}`);
    }
  }

  async deleteModule(moduleId: Id<'training_modules'>): Promise<{ success: boolean }> {
    try {
      const result = await this.convex.client.mutation(api.training.courses.deleteModule, { moduleId });
      return result;
    } catch (error: any) {
      console.error('❌ Delete module failed:', error);
      throw new Error(`Failed to delete module: ${error.message}`);
    }
  }

  // ============================================================================
  // FILE/CONTENT MANAGEMENT
  // ============================================================================

  async uploadModuleFile(file: File): Promise<Id<'_storage'>> {
    try {
      console.log('📤 Uploading file:', file.name, file.type, `${(file.size / 1024 / 1024).toFixed(2)}MB`);

      const uploadUrl = await this.convex.client.mutation(api.files.generateUploadUrl, {});

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file
      });

      if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`);

      const { storageId } = await response.json();
      console.log('✅ File uploaded successfully:', storageId);
      return storageId as Id<'_storage'>;
    } catch (error: any) {
      console.error('❌ File upload failed:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async getModuleContentUrl(storageId: Id<'_storage'>): Promise<string | null> {
    try {
      const url = await this.convex.client.query(api.files.getUrl as any, { storageId });
      if (!url) {
        console.warn('⚠️ No URL returned for storage ID:', storageId);
        return null;
      }
      return url;
    } catch (error: any) {
      console.error('❌ Failed to get content URL:', error);
      return null;
    }
  }

  async updateModuleContent(
    moduleId: Id<'training_modules'>,
    contentId: Id<'_storage'>
  ): Promise<{ success: boolean }> {
    try {
      const result = await this.convex.client.mutation(api.training.courses.updateModuleContent, {
        moduleId,
        contentId
      });
      return result;
    } catch (error: any) {
      console.error('❌ Update module content failed:', error);
      throw new Error(`Failed to update module content: ${error.message}`);
    }
  }

  async deleteModuleContent(moduleId: Id<'training_modules'>): Promise<{ success: boolean }> {
    try {
      const result = await this.convex.client.mutation(api.training.courses.updateModuleContent, {
        moduleId,
        contentId: undefined as any
      });
      return result;
    } catch (error: any) {
      console.error('❌ Delete module content failed:', error);
      throw new Error(`Failed to delete module content: ${error.message}`);
    }
  }

  async uploadCertificateTemplate(storageId: Id<'_storage'>, courseId: Id<'training_courses'>) {
    return this.convex.client.mutation(api.training.courses.updateCourse, {
      courseId,
      certificateTemplateId: storageId
    });
  }

  // ============================================================================
  // VALIDATION HELPERS
  // ============================================================================

  validateModuleFile(file: File, contentType: 'video' | 'document'): string | null {
    const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
    const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024; // 50MB

    const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    const ALLOWED_DOCUMENT_TYPES = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (contentType === 'video') {
      if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
        return 'Invalid video format. Please upload MP4, WebM, OGG, or MOV files.';
      }
      if (file.size > MAX_VIDEO_SIZE) {
        return `Video file too large. Maximum size is ${MAX_VIDEO_SIZE / 1024 / 1024}MB.`;
      }
    } else if (contentType === 'document') {
      if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
        return 'Invalid document format. Please upload PDF, DOC, or DOCX files.';
      }
      if (file.size > MAX_DOCUMENT_SIZE) {
        return `Document too large. Maximum size is ${MAX_DOCUMENT_SIZE / 1024 / 1024}MB.`;
      }
    }

    return null;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  // ============================================================================
  // PROGRESS/ENROLLMENT MANAGEMENT
  // ============================================================================

  async listProgress(
    numItems: number = 50,
    cursor: string | null = null,
    courseId?: Id<'training_courses'>,
    status?: 'not_started' | 'in_progress' | 'completed' | 'failed' | null
  ) {
    return this.convex.client.query(api.training.progress.listProgress, {
      paginationOpts: { numItems, cursor },
      courseId,
      status: status || undefined
    });
  }

  async getProgress(progressId: Id<'training_progress'>) {
    return this.convex.client.query(api.training.progress.getProgress, { progressId });
  }

  async enrollExecutive(executiveId: Id<'executives'>, courseId: Id<'training_courses'>) {
    return this.convex.client.mutation(api.training.progress.enrollExecutive, {
      executiveId,
      courseId
    });
  }

  async updateModuleProgress(
    moduleProgressId: Id<'training_module_progress'>,
    data: {
      status: 'in_progress' | 'completed';
      score?: number;
      timeSpentMinutes: number;
    }
  ) {
    return this.convex.client.mutation(api.training.progress.updateModuleProgress, {
      moduleProgressId,
      ...data
    });
  }

async generateCertificate(progressId: Id<'training_progress'>) {
  return this.convex.client.action(
    api.training.certificates.generateCertificate, 
    { progressId }
  );
}

  async getCertificateUrl(certificateId: Id<'_storage'>): Promise<string | null> {
    try {
      const url = await this.convex.client.query(api.training.progress.getCertificateUrl, {
        certificateId
      });
      return url;
    } catch {
      return null;
    }
  }

  async getExecutiveStats(executiveId: Id<'executives'>) {
    return this.convex.client.query(api.training.progress.getExecutiveTrainingStats, {
      executiveId
    });
  }

  async getExecutiveProgress(executiveId: Id<'executives'>) {
    return this.convex.client.query(api.training.progress.getExecutiveProgress, {
      executiveId
    });
  }
}
