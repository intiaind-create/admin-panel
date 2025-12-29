// src/app/features/task-management/services/task.service.ts

import { Injectable } from '@angular/core';
import { ConvexService } from '@/core/services/convex.service';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';

import {
    Task,
    EnrichedTask,
    TaskStatus,
    TaskPriority,
    ExecutiveTaskStatus,
    AdminTaskStatus,
    CreateTaskData,
    UpdateTaskData,
    TaskStats,
    MyTaskStats,
    DashboardSummary,
    TopPerformer
} from '../models';

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
        paginationOpts: { numItems: number; cursor: string | null },
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
async getPendingApprovals(): Promise<EnrichedTask[]> {
  return this.convex.query(api.tasks.admin.queries.getPendingApprovals, {});
}
    // ============================================================================
    // APPROVAL MUTATIONS (YOUR PATH: tasks/me/mutation)
    // ============================================================================
async approveTaskCompletion(approvalId: Id<'approval_requests'>) {
  console.log('🔵 [SERVICE] approveTaskCompletion called with:', approvalId);
  console.log('🔵 [SERVICE] approvalId type:', typeof approvalId);
  
  try {
    const profile = await this.convex.query(api.auth.getCurrentUserProfile, {});
    console.log('🔵 [SERVICE] Profile loaded:', profile);
    
    if (!profile?.adminUserId) {
      throw new Error("No admin profile found");
    }
    
    const approverId = profile.adminUserId;
    console.log('🔵 [SERVICE] Calling mutation with:', { approvalId, approverId });
    
    const result = await this.convex.mutation(api.tasks.me.mutation.approveTaskCompletion, {
      approvalId,
      approverId
    });
    
    console.log('🔵 [SERVICE] Mutation result:', result);
    return result;
    
  } catch (error) {
    console.error('🔴 [SERVICE] Error in approveTaskCompletion:', error);
    throw error;
  }
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

    // ============================================================================
    // EXECUTIVE TASKS (tasks/me)
    // ============================================================================
    getMyTasks(filters?: { status?: TaskStatus; priority?: TaskPriority }) {
        return this.convex.query(
            api.tasks.me.queries.getMyTasks,
            filters || {}
        );
    }

    updateMyTaskStatus(
        taskId: Id<'tasks'>,
        status: ExecutiveTaskStatus,
        notes?: string,
        location?: { latitude: number; longitude: number; address: string }
    ) {
        return this.convex.mutation(api.tasks.me.mutation.updateTaskStatus, {
            taskId,
            status,
            notes,
            location
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

    getStatusSeverity(
        status: TaskStatus
    ): 'success' | 'info' | 'warn' | 'danger' {
        switch (status) {
            case 'completed':
                return 'success';
            case 'in_progress':
                return 'info';
            case 'pending':
                return 'warn';
            case 'overdue':
                return 'danger';
            default:
                return 'info';
        }
    }

    getPrioritySeverity(
        priority: TaskPriority
    ): 'success' | 'info' | 'warn' | 'danger' {
        switch (priority) {
            case 'low':
                return 'success';
            case 'medium':
                return 'info';
            case 'high':
                return 'warn';
            case 'urgent':
                return 'danger';
            default:
                return 'info';
        }
    }
}
