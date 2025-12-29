// src/app/features/task-management/models/task.interface.ts

import { Id } from "convex/_generated/dataModel";


// ============================================================================
// TYPE ALIASES
// ============================================================================

export type TaskStatus = 'pending' | 'in_progress' | 'overdue' | 'completed';
export type ExecutiveTaskStatus = 'in_progress' | 'completed';
export type AdminTaskStatus = 'pending' | 'in_progress' | 'overdue' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskType = 'verification' | 'survey' | 'collection' | 'other';

// ============================================================================
// BASE TASK INTERFACE
// ============================================================================

export interface Task {
  _id: Id<'tasks'>;
  title: string;
  description: string;
  type: 'verification' | 'survey' | 'collection' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  rootId: string;
  hierarchyId?: Id<'hierarchies'>; // ✅ Optional
  
  // ✅ Geographic fields
  zone?: string;
  district?: string;
  subdistrict?: string;
  localBody?: string;
  ward?: string;
  
  assignedBy: Id<'admin_users'>;
  assignedTo: Id<'executives'>;
  dueDate: number;
  estimatedHours: number;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  completedAt?: number;
  wardId: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  notes?: string;
  createdAt: number;
  updatedAt: number;
  isDeleted: boolean;
}

// ============================================================================
// ENRICHED TASK (with joined data)
// ============================================================================

export interface EnrichedTask extends Task {
  executiveName?: string; // ✅ Make optional
  executiveEmployeeId?: string; // ✅ Make optional
  executivePhone?: string; // ✅ Make optional
  assignerName?: string; // ✅ Make optional
  isOverdue: boolean;
  hierarchyName?: string;
  assignedToName?: string; // ✅ Add this
  assignedByName?: string; // ✅ Add this
  approvalId?: Id<"approval_requests">;
}

// ============================================================================
// CREATE/UPDATE DTOs
// ============================================================================

export interface CreateTaskData {
  title: string;
  description: string;
  priority: TaskPriority;
  assignedTo: Id<'executives'>;
  dueDate: number;
  estimatedHours: number;
  wardId: string;
  location?: TaskLocation;
  notes?: string;
  type: TaskType;
  votersList?: string[];
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: AdminTaskStatus;
  priority?: TaskPriority;
  dueDate?: number;
  estimatedHours?: number;
  notes?: string;
  assignedTo?: Id<'executives'>;  
  wardId?: string;   
   votersList?: string[];             
}

export interface TaskLocation {
  latitude: number;
  longitude: number;
  address: string;
}

export interface TaskFilters {
  status?: 'pending' | 'in_progress' | 'completed' | 'overdue';
  assignedTo?: Id<'executives'>;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  zone?: string;
  district?: string;
}

export interface CreateTaskArgs {
  title: string;
  description: string;
  type: 'verification' | 'survey' | 'collection' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  hierarchyId?: Id<'hierarchies'>; // ✅ Optional
  zone?: string;
  district?: string;
  subdistrict?: string;
  localBody?: string;
  ward?: string;
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
}

export interface UpdateTaskArgs {
  taskId: Id<'tasks'>;
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'pending' | 'in_progress' | 'completed' | 'overdue';
  dueDate?: number;
  estimatedHours?: number;
  notes?: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export interface Executive {
  _id: Id<'executives'>;
  name: string;
  email: string;
  employeeId: string;
  wardId: string;
  wardName?: string;           // ✅ display name
  assignedWards?: string[];
  assignedWardNames?: string[]; // optional, if you use multiple wards later
  zone?: string;
  district?: string;
  hierarchyId?: Id<'hierarchies'>;
}
export interface Voter {
  _id: string;
  name: string;
  fatherHusbandName: string;
  age: number;
  address: string;
  sex: string;
  selected: boolean;
}