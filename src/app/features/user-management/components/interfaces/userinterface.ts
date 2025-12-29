import { Id } from "convex/_generated/dataModel";

export interface BaseUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  hierarchyName?: string;
  hierarchyPath?: string;
  createdAt: number;
}

export interface AdminUser extends BaseUser {
  roleLevel: number;
  roleName: string;
  lastLogin?: number;
  managerName?: string | null;
}

export interface ExecutiveUser extends BaseUser {
  employeeId: string;
  wardId: string;
  managerName?: string | null;
  managerEmail?: string;
  jobTitle?: string;
  department?: string;
}

export interface StatusOption {
  value: boolean | null;
  label: string;
}

export type UserDetail = AdminUser | ExecutiveUser;

export type TopPerformer = {
  _id: Id<"executives">;
  name: string;
  employeeId: string;
  email: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
};

export type DashboardSummary = {
  taskStats: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    completionRate: number;
  };
  topPerformers: TopPerformer[];
  recentActivity: Array<{
    _id: Id<"tasks">;
    title: string;
    status: string;
    priority: string;
    dueDate: number;
    createdAt: number;
  }>;
  totalExecutives: number;
  activeExecutives: number;
};

// ✅ UPDATED: Now uses hierarchyId instead of geographic fields
export interface CreateAdminArgs {
  name: string;
  email: string;
  phone?: string;
  roleLevel: number;
  managerId?: Id<'admin_users'>;
  
  // ✅ Geographic fields instead of hierarchyId
  zone?: string;
  district?: string;
  subdistrict?: string;
  localBody?: string;
  ward?: string;
}
export interface UpdateAdminArgs {
  userId: Id<'admin_users'>;
  name?: string;
  phone?: string;
  roleLevel?: number;
  isActive?: boolean;
  hierarchyId?: Id<'hierarchies'>; // ✅ Optional for updates
  managerId?: Id<'admin_users'>;
}

export type CreateExecutiveArgs = {
  // Basic Info
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  employeeId: string;
  
  // Personal Details (optional)
  dateOfBirth?: number;
  governmentId?: string;
  currentAddress?: string;
  
  // Employment
  jobTitle?: string;
  department?: string;
  contractType?: string;
  managerId: Id<"admin_users">;
  
  // Area of Operation
  region?: string;
  primaryTerritory?: string;
  assignedZones?: string[];
  
  // Standard
  wardIds: string[];
  hierarchyId: Id<"hierarchies">;
};

export type UpdateExecutiveArgs = {
  executiveId: Id<"executives">;
  name?: string;
  phone?: string;
  wardId?: string;
  managerId?: Id<"admin_users">;
  isActive?: boolean;
};

// ============================================================================
// DROPDOWN TYPES
// ============================================================================

export type DropdownOption = {
  value: string;
  label: string;
};

export type HierarchyOption = {
  _id: string;
  name: string;
  level: number;
  pathString: string;
  parentId: string | null;
};

export type ManagerOption = {
  _id: string;
  name: string;
  email: string;
  roleLevel: number;
  roleName: string;
  hierarchyName?: string;
  hierarchyPath?: string;
};

export interface RoleOption {
  value: number | null;
  label: string;
}

export type WardOption = {
  value: Id<"wards"> | string;
  label: string;
  wardCode?: string;
  fullPath: string;
};

export type ValidationResult = {
  valid: boolean;
  reason: string | null;
};

export type BackendRoleOption = {
  level: number;
  name: string;
};