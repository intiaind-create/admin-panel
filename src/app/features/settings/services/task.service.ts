// src/app/features/tasks/services/task.service.ts

import { Injectable } from '@angular/core';
import { ConvexService } from '@/core/services/convex.service';
import { Id } from 'convex/_generated/dataModel';
import { api } from 'convex/_generated/api';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type TaskStatus = 'pending' | 'in_progress' | 'overdue' | 'completed';
export type ExecutiveTaskStatus = 'in_progress' | 'completed';
export type AdminTaskStatus =
    | 'pending'
    | 'in_progress'
    | 'overdue'
    | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export interface MyTaskStats {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    thisWeek: number;
    completionRate: number;
}

// ✅ Keep the full TaskStats
export interface TaskStats {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    urgent: number;
    high: number;
    medium: number;
    low: number;
    completionRate: number;
}

export interface Task {
    _id: Id<'tasks'>;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    assignedTo: Id<'executives'>;
    assignedBy: Id<'admin_users'>;
    dueDate: number;
    completedAt?: number;
    hierarchyId: Id<'hierarchies'>;
    rootId: Id<'hierarchies'>;
    isDeleted: boolean;
    createdAt: number;
    _creationTime: number;
}

export interface EnrichedTask extends Task {
    executiveName: string;
    executiveEmployeeId: string;
    executivePhone?: string;
    assignerName: string;
    isOverdue: boolean;
}

export interface DashboardTaskStats {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    completionRate: number;
}

export interface TaskStats {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    urgent: number;
    high: number;
    medium: number;
    low: number;
    completionRate: number;
}

export interface TopPerformer {
    _id: Id<'executives'>;
    name: string;
    employeeId: string;
    email: string;
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
}

export interface DashboardSummary {
    taskStats: DashboardTaskStats;
    topPerformers: TopPerformer[];
    recentActivity: Array<{
        _id: Id<'tasks'>;
        title: string;
        status: TaskStatus;
        priority: TaskPriority;
        dueDate: number;
        createdAt: number;
    }>;
    totalExecutives: number;
    activeExecutives: number;
}

export interface CreateTaskData {
    title: string;
    description: string;
    priority: TaskPriority;
    assignedTo: Id<'executives'>;
    dueDate: number;
    estimatedHours: number;
    wardId: string;
    location?: {
        latitude: number;
        longitude: number;
        address: string;
    };
    notes?: string;
    type: 'verification' | 'survey' | 'collection' | 'other';
}

export interface UpdateTaskData {
    title?: string;
    description?: string;
    status?: AdminTaskStatus;
    priority?: TaskPriority;
    dueDate?: number;
    estimatedHours?: number;
    notes?: string;
}

// ============================================================================
// TASK SERVICE
// ============================================================================

@Injectable({
    providedIn: 'root'
})
export class TaskService {
    private get convex() {
        return this.convexService.client;
    }

    constructor(private convexService: ConvexService) {}

    // ============================================================================
    // ADMIN TASK QUERIES
    // ============================================================================

    listTasks(
        paginationOpts: any,
        filters?: {
            status?: TaskStatus;
            priority?: TaskPriority;
            assignedTo?: Id<'executives'>;
            search?: string;
        }
    ) {
        return this.convex.query(api.tasks.admin.queries.listTasks, {
            paginationOpts,
            ...filters
        });
    }

    getTask(taskId: Id<'tasks'>) {
        return this.convex.query(api.tasks.admin.queries.getTask, { taskId });
    }

    getExecutiveTasks(
        executiveId: Id<'executives'>,
        startDate?: number,
        endDate?: number
    ) {
        return this.convex.query(api.tasks.admin.queries.getExecutiveTasks, {
            executiveId,
            startDate,
            endDate
        });
    }

    getTaskStats(): Promise<TaskStats> {
        return this.convex.query(api.tasks.admin.queries.getTaskStats, {});
    }

    getRecentActivity(limit?: number) {
        return this.convex.query(api.tasks.admin.queries.getRecentActivity, {
            limit
        });
    }

    getDashboardSummary(): Promise<DashboardSummary> {
        return this.convex.query(
            api.tasks.admin.queries.getDashboardSummary,
            {}
        );
    }

    async getTopPerformers(): Promise<TopPerformer[]> {
        const dashboard = await this.getDashboardSummary();
        return dashboard.topPerformers;
    }

    // ============================================================================
    // ADMIN TASK MUTATIONS
    // ============================================================================

    createTask(taskData: CreateTaskData) {
        return this.convex.mutation(
            api.tasks.admin.mutation.createTask,
            taskData
        );
    }

    updateTask(taskId: Id<'tasks'>, updates: UpdateTaskData) {
        return this.convex.mutation(api.tasks.admin.mutation.updateTask, {
            taskId,
            ...updates
        });
    }

    deleteTask(taskId: Id<'tasks'>) {
        return this.convex.mutation(api.tasks.admin.mutation.deleteTask, {
            taskId
        });
    }

    reassignTask(taskId: Id<'tasks'>, newExecutiveId: Id<'executives'>) {
        return this.convex.mutation(api.tasks.admin.mutation.reassignTask, {
            taskId,
            newExecutiveId
        });
    }

    // ============================================================================
    // MY TASKS (For executives)
    // ============================================================================

    getMyTasks(filters?: { status?: TaskStatus; priority?: TaskPriority }) {
        return this.convex.query(
            api.tasks.me.queries.getMyTasks,
            filters || {}
        );
    }

    getMyTaskStats() {
        return this.convex.query(api.tasks.me.queries.getMyTaskStats, {});
    }

    updateMyTaskStatus(
        taskId: Id<'tasks'>,
        status: ExecutiveTaskStatus,
        notes?: string,
        location?: {
            latitude: number;
            longitude: number;
            address: string;
        }
    ) {
        return this.convex.mutation(api.tasks.me.mutation.updateTaskStatus, {
            taskId,
            status,
            notes,
            location
        });
    }

    completeMyTask(
        taskId: Id<'tasks'>,
        notes?: string,
        location?: {
            latitude: number;
            longitude: number;
            address: string;
        }
    ) {
        return this.updateMyTaskStatus(taskId, 'completed', notes, location);
    }

    startMyTask(
        taskId: Id<'tasks'>,
        notes?: string,
        location?: {
            latitude: number;
            longitude: number;
            address: string;
        }
    ) {
        return this.updateMyTaskStatus(taskId, 'in_progress', notes, location);
    }

    // ============================================================================
    // ADDITIONAL EXECUTIVE MUTATIONS
    // ============================================================================

    submitForApproval(
        taskId: Id<'tasks'>,
        completionNotes: string,
        attachmentIds?: Id<'_storage'>[]
    ) {
        return this.convex.mutation(api.tasks.me.mutation.submitForApproval, {
            taskId,
            completionNotes,
            attachmentIds
        });
    }

    addTaskAttachment(
        taskId: Id<'tasks'>,
        storageId: Id<'_storage'>,
        fileName: string,
        fileType: string,
        fileSize: number
    ) {
        return this.convex.mutation(api.tasks.me.mutation.addTaskAttachment, {
            taskId,
            storageId,
            fileName,
            fileType,
            fileSize
        });
    }

    // ============================================================================
    // APPROVAL MUTATIONS (For managers)
    // ============================================================================

    /**
     * ✅ FIXED: Table name is "approval_requests", not "task_approvals"
     */
    async approveTaskCompletion(approvalId: Id<'approval_requests'>) {
      const profile = await this.convex.query(api.auth.getCurrentUserProfile, {});
      
      if (!profile?.adminUserId) {
        throw new Error("No admin profile found");
      }
      
      const approverId = profile.adminUserId;
      
      return this.convex.mutation(api.tasks.me.mutation.approveTaskCompletion, {
        approvalId,
        approverId
      });
    }
    
    
    async rejectTaskCompletion(approvalId: Id<'approval_requests'>, rejectionReason: string) {
      const profile = await this.convex.query(api.auth.getCurrentUserProfile, {});
    
        if (!profile?.adminUserId) {
        throw new Error("No admin profile found");
      }
      const approverId = profile.adminUserId!;  // ✅ Same fix
      
      return this.convex.mutation(api.tasks.me.mutation.rejectTaskCompletion, {
        approvalId,
        rejectionReason,
        approverId
      });
    }

    // ============================================================================
    // UTILITY METHODS
    // ============================================================================

    isTaskOverdue(task: Task): boolean {
        return !task.completedAt && task.dueDate < Date.now();
    }

    getStatusColor(status: TaskStatus): string {
        const colors: Record<TaskStatus, string> = {
            pending: '#FFA726',
            in_progress: '#42A5F5',
            overdue: '#EF5350',
            completed: '#66BB6A'
        };
        return colors[status] || '#757575';
    }

    getPriorityColor(priority: TaskPriority): string {
        const colors: Record<TaskPriority, string> = {
            low: '#78909C',
            medium: '#FFA726',
            high: '#FF7043',
            urgent: '#EF5350'
        };
        return colors[priority] || '#757575';
    }

    formatDueDate(timestamp: number): string {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = timestamp - now.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return `${Math.abs(diffDays)} days overdue`;
        } else if (diffDays === 0) {
            return 'Due today';
        } else if (diffDays === 1) {
            return 'Due tomorrow';
        } else if (diffDays < 7) {
            return `Due in ${diffDays} days`;
        } else {
            return date.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        }
    }

    canExecutiveSetStatus(status: TaskStatus): status is ExecutiveTaskStatus {
        return status === 'in_progress' || status === 'completed';
    }

    convertToStorageIds(stringIds: string[]): Id<'_storage'>[] {
        return stringIds as unknown as Id<'_storage'>[];
    }
}
