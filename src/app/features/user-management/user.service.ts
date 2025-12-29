// src/app/features/user-management/user.service.ts

import { Injectable } from '@angular/core';
import { ConvexService } from '../../core/services/convex.service';
import { DashboardSummary, TopPerformer } from '../task-management/models';
import {
    CreateAdminArgs,
    UpdateAdminArgs,
    CreateExecutiveArgs,
    UpdateExecutiveArgs,
    ManagerOption,
    RoleOption,
    ValidationResult,
    WardOption,
    DropdownOption,
    HierarchyOption,
    BackendRoleOption
} from './components/interfaces/userinterface';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';

// Type definitions

@Injectable({ providedIn: 'root' })
export class UserService {
    private get convex() {
        return this.convexService.client;
    }

    constructor(private convexService: ConvexService) {}


  getAdmins(
        paginationOpts: any, 
        filters?: { search?: string; roleLevel?: number; isActive?: boolean }
    ): Promise<any> {
        return this.convex.query(api.users.admin.queries.listAdmins, {
            paginationOpts,
            ...filters,
        });
    }

    getAdminById(id: Id<"admin_users">): Promise<any> {
        return this.convex.query(api.users.admin.queries.getAdminUser, { userId: id });
    }

    createAdmin(userData: CreateAdminArgs): Promise<any> {
      console.log('📤 Sending to backend:', userData);
        return this.convex.action(api.users.admin.mutations.createAdminAccount, userData);
    }

    updateAdmin(userData: UpdateAdminArgs): Promise<any> {
        return this.convex.action(api.users.admin.mutations.updateAdminUser, userData);
    }

    deleteAdmin(userId: Id<"admin_users">): Promise<any> {
        return this.convex.action(api.users.admin.mutations.deleteAdminUser, { userId });
    }

    // --- Executive Functions ---

   getExecutives(
        paginationOpts: any, 
        filters?: { search?: string; wardId?: string; managerId?: Id<"admin_users">; isActive?: boolean }
    ): Promise<any> {
        return this.convex.query(api.users.admin.queries.listAllExecutives, {
            paginationOpts,
            ...filters,
        });
    }
async getAdminUserForEdit(userId: Id<'admin_users'>): Promise<any> {
  return this.convex.query(api.users.admin.queries.getAdminUserForEdit, { userId });
}

    getExecutiveById(id: Id<"executives">): Promise<any> {
        return this.convex.query(api.users.admin.queries.getExecutive, { executiveId: id });
    }

    createExecutive(userData: CreateExecutiveArgs): Promise<any> {
        return this.convex.action(api.users.admin.mutations.createExecutiveAccount, userData);
    }

  
    deleteExecutive(executiveId: Id<"executives">): Promise<any> {
        return this.convex.action(api.users.admin.mutations.deleteExecutive, { executiveId });
    }
async getExecutiveForEdit(executiveId: Id<'executives'>): Promise<any> {
  return this.convex.query(api.executives.queries.getExecutiveForEdit, { executiveId });
}

async updateExecutive(data: {
  executiveId: Id<'executives'>;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: number;
  governmentId?: string;
  currentAddress?: string;
  jobTitle?: string;
  department?: string;
  contractType?: string;
  managerId?: Id<'admin_users'>;
  region?: string;
  primaryTerritory?: string;
  assignedZones?: string[];
  wardIds?: string[];
  isActive?: boolean;
}): Promise<{ success: boolean }> {
  return this.convex.action(api.users.admin.mutations.updateExecutiveAccount, data);
}

    // --- Bulk Operations ---

  bulkImportExecutives(csvData: Array<{
    name: string;
    email: string;
    phone: string;
    employeeId: string;
    wardIds: string;
    managerEmail: string;
  }>): Promise<any> {
    return this.convex.action(api.users.admin.actions.bulkImportExecutives, { csvData });
  }
  exportExecutivesToCSV(filters?: { hierarchyId?: Id<"hierarchies">; isActive?: boolean }): Promise<string> {
    return this.convex.action(api.users.admin.actions.exportExecutivesToCSV, filters || {});
  }

  generateExecutiveReport(
    executiveId: Id<"executives">, 
    startDate: number, 
    endDate: number
  ): Promise<any> {
    return this.convex.action(api.users.admin.actions.generateExecutiveReport, {
      executiveId,
      startDate,
      endDate,
    });
  }

    // --- Hierarchy ---
  getHierarchyStructure(): Promise<any> {
    return this.convex.query(api.users.admin.queries.getHierarchyStructure, {});
  }


    // ✅ FIXED: Correct path for dashboard
  getDashboardSummary(): Promise<DashboardSummary> {
    return this.convex.query(api.tasks.admin.queries.getDashboardSummary, {});
  }

    // ✅ Helper method for top performers
  async getTopPerformers(): Promise<TopPerformer[]> {
    const dashboard = await this.getDashboardSummary();
    return dashboard.topPerformers;
  }

async createAdminUser(formData: {
  name: string;
  email: string;
  phone?: string;
  roleLevel: number;
  managerId?: string;
  zone?: string;
  district?: string;
  subdistrict?: string;
  localBody?: string;
  ward?: string;
}): Promise<any> {
  const adminData: CreateAdminArgs = {
    email: formData.email,
    name: formData.name,
    phone: formData.phone,
    roleLevel: formData.roleLevel,
    managerId: formData.managerId ? (formData.managerId as Id<"admin_users">) : undefined,
    
    // ✅ Pass geographic fields
    zone: formData.zone,
    district: formData.district,
    subdistrict: formData.subdistrict,
    localBody: formData.localBody,
    ward: formData.ward,
  };

  console.log('📤 Sending to backend:', adminData);

  return this.createAdmin(adminData);
}
async updateAdminUser(data: {
  userId: Id<'admin_users'>;
  name?: string;
  phone?: string;
  roleLevel?: number;
  isActive?: boolean;
  zone?: string;
  district?: string;
  subdistrict?: string;
  localBody?: string;
  ward?: string;
}): Promise<{ success: boolean }> {
  return this.convex.action(api.users.admin.mutations.updateAdminUser, data);
}

    // ✅ NEW: Get hierarchies for dropdown
  getHierarchies(roleLevel?: number): Promise<HierarchyOption[]> {
    return this.convex.query(api.users.admin.lookups.listHierarchiesForDropdown, {
      roleLevel: roleLevel,
    });
  }
  getManagersForAdmin(hierarchyId: string, roleLevel: number): Promise<ManagerOption[]> {
    return this.convex.query(api.users.admin.lookups.listManagersForAdmin, {
      hierarchyId: hierarchyId as Id<"hierarchies">,
      roleLevel: roleLevel,
    });
  }


    // ✅ NEW: Get managers by hierarchy for dropdown
  getManagersByHierarchy(hierarchyId: string): Promise<ManagerOption[]> {
    return this.convex.query(api.users.admin.lookups.getManagersForExecutives, {
      hierarchyId: hierarchyId as Id<"hierarchies">,
    });
  }

async getAvailableRoles(): Promise<RoleOption[]> {
  const backendRoles: BackendRoleOption[] = await this.convex.query(
    api.users.admin.lookups.getAvailableRoleLevels, 
    {}
  );
  
  // Transform to frontend format
  return backendRoles.map(role => ({
    value: role.level,
    label: role.name
  }));
}
  validateHierarchyForRole(hierarchyId: string, roleLevel: number): Promise<ValidationResult> {
    return this.convex.query(api.users.admin.lookups.validateHierarchyForRole, {
      hierarchyId: hierarchyId as Id<"hierarchies">,
      roleLevel: roleLevel,
    });
  }

    getZones(): Promise<DropdownOption[]> {
    return this.convex.query(api.users.admin.lookups.getZonesForExecutives, {});
  }

   getDistricts(zone?: string): Promise<DropdownOption[]> {
    return this.convex.query(api.users.admin.lookups.getDistrictsForExecutives, { zone });
  }

  /**
   * Get subdistricts
   */
  getSubdistricts(zone?: string, district?: string): Promise<DropdownOption[]> {
    return this.convex.query(api.users.admin.lookups.getSubdistrictsForExecutives, {
      zone,
      district,
    });
  }

  /**
   * Get local body types (Panchayath, Municipality, Corporation)
   */
  getLocalBodyTypes(): Promise<DropdownOption[]> {
    return this.convex.query(api.users.admin.lookups.getLocalBodyTypesForExecutives, {});
  }

  /**
   * Get local bodies (filtered by zone/district/subdistrict/type)
   */
getLocalBodies(filters: {
  zone?: string;
  district?: string;
  subdistrict?: string;
  localBodyType?: string;
}): Promise<DropdownOption[]> {
  return this.convex.query(api.users.admin.lookups.getLocalBodiesForExecutives, filters);
}

  /**
   * Get wards (optional - for specific ward assignment)
   */
  getWards(filters: {
    zone?: string;
    district?: string;
    subdistrict?: string;
    localBodyName?: string;
    limit?: number;
  }): Promise<WardOption[]> {
    return this.convex.query(api.users.admin.lookups.getWardsForExecutives, filters);
  }

  // ============================================================================
  // LOOKUPS - EMPLOYMENT
  // ============================================================================

  /**
   * Get contract types (Full-Time, Part-Time, Contract)
   */
  getContractTypes(): Promise<DropdownOption[]> {
    return this.convex.query(api.users.admin.lookups.getContractTypes, {});
  }

  /**
   * Get departments (future use)
   */
  getDepartments(): Promise<DropdownOption[]> {
    return this.convex.query(api.users.admin.lookups.getDepartments, {});
  }

    // ✅ Helper: Flatten hierarchy for dropdown
    private flattenHierarchy(structure: any): Array<{ _id: string; name: string; level: number }> {
    const flattened: Array<{ _id: string; name: string; level: number }> = [];
    
    const flatten = (node: any, level: number = 0) => {
      if (node._id) {
        flattened.push({
          _id: node._id,
          name: node.name || 'Unknown',
          level,
        });
      }
      
      if (node.children) {
        node.children.forEach((child: any) => flatten(child, level + 1));
      }
    };

    if (Array.isArray(structure)) {
      structure.forEach(node => flatten(node));
    } else {
      flatten(structure);
    }

    return flattened;
  }

  async generatePasswordResetToken(email: string): Promise<{ token: string; expiresAt: number }> {
  return this.convex.action(api.users.admin.actions.generatePasswordResetToken, { 
    email 
  });
}

/**
 * ✅ Get managers based on geography and role (for executives)
 * Supports both ward-based and blanketed position assignments
 */
getManagersForExecutiveByGeography(params: {
  zone?: string;
  district?: string;
  subdistrict?: string;
  wardIds?: string[];
  executiveRoleLevel?: number;
}): Promise<Array<{ 
  value: string; 
  label: string; 
  roleLevel: number;
  zone?: string;
  district?: string;
  subdistrict?: string;
}>> {
  return this.convex.query(
    api.users.admin.lookups.getManagersForExecutiveByGeography,
    params
  );
}
}
