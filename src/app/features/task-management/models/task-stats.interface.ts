// src/app/features/task-management/models/task-stats.interface.ts

import { Id } from 'convex/_generated/dataModel';
import { TaskStatus, TaskPriority } from './task.interface';

// ============================================================================
// STATS INTERFACES
// ============================================================================

export interface MyTaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  thisWeek: number;
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

export interface DashboardTaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  completionRate: number;
}

// ============================================================================
// TOP PERFORMERS
// ============================================================================

export interface TopPerformer {
  _id: Id<'executives'>;
  name: string;
  employeeId: string;
  email: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

// ============================================================================
// DASHBOARD SUMMARY
// ============================================================================

export interface DashboardSummary {
  taskStats: DashboardTaskStats;
  topPerformers: TopPerformer[];
  recentActivity: RecentActivityItem[];
  totalExecutives: number;
  activeExecutives: number;
}

export interface RecentActivityItem {
  _id: Id<'tasks'>;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: number;
  createdAt: number;
}
