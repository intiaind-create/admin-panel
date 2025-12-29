// admin-backend/convex/users/_lib.ts

import { v } from "convex/values";
import { QueryCtx, MutationCtx } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "../_generated/dataModel";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Security Profile - Complete user security context
 * Used for RBAC and hierarchy-based access control
 */
export interface SecurityProfile {
  userId: Id<"admin_users"> | Id<"executives">; // ✅ Can be either type
  userType: "admin" | "executive"; // ✅ NEW: Discriminator field
  rootId: string;
  hierarchyId?: Id<"hierarchies">; // ✅ Optional (legacy support)
  hierarchyPath: string;
  email: string;
  name: string;
  isActive: boolean;

  // ✅ Admin-specific fields (optional for executives)
  roleLevel?: number;
  roleName?: string;

  // ✅ Geographic fields (both admin and executive)
  zone?: string;
  district?: string;
  subdistrict?: string;
  localBody?: string;
  ward?: string; // ✅ For admins (optional string)
  wardId?: string; // ✅ For executives (string ID)

  // ✅ Executive-specific fields (optional for admins)
  employeeId?: string;
  phone?: string;
  managerId?: Id<"admin_users">;
  assignedWards?: string[]; // For executives with multiple wards
}

// ============================================================================
// CORE SECURITY FUNCTIONS
// ============================================================================

/**
 * The "Gatekeeper" - Core Security Function
 * Validates authentication, fetches user security context
 *
 * ✅ UPDATED: Supports both admin and executive users
 *
 * CRITICAL: Call this at the start of every protected query/mutation
 *
 * @throws Error if user is not authenticated or not found
 * @returns SecurityProfile with full user context
 */
export async function getSecurityProfile(
  ctx: QueryCtx | MutationCtx
): Promise<SecurityProfile> {
  // Get auth user ID
  const authUserId = await getAuthUserId(ctx);
  if (!authUserId) {
    throw new Error("Not authenticated");
  }

  console.log("Auth user ID:", authUserId);

  // ✅ TRY ADMIN FIRST
  const adminUser = await ctx.db
    .query("admin_users")
    .withIndex("by_convexId", (q: any) => q.eq("convexId", authUserId))
    .first();

  if (adminUser) {
    console.log("Fetched admin user:", adminUser);

    // Check if active
    if (!adminUser.isActive) {
      console.log("Admin isActive:", adminUser.isActive);
      throw new Error("Account is deactivated");
    }

    // Get hierarchy info (optional now)
    const hierarchy = adminUser.hierarchyId
      ? await ctx.db.get(adminUser.hierarchyId)
      : null;

    // Build hierarchy path from hierarchy or geographic fields
    const hierarchyPath =
      hierarchy?.pathString ||
      [
        adminUser.zone,
        adminUser.district,
        adminUser.subdistrict,
        adminUser.localBody,
        adminUser.ward,
      ]
        .filter(Boolean)
        .join("/") ||
      "";

    // Get rootId from hierarchy or directly from adminUser
    const rootId = hierarchy?.rootId || adminUser.rootId;

    // ✅ Return ADMIN SecurityProfile
    return {
      userId: adminUser._id,
      userType: "admin", // ✅ Discriminator
      rootId: rootId,
      hierarchyId: adminUser.hierarchyId,
      hierarchyPath: hierarchyPath,
      roleLevel: adminUser.roleLevel,
      roleName: adminUser.roleName,
      email: adminUser.email,
      name: adminUser.name,
      isActive: adminUser.isActive,

      // Geographic fields (admins use "ward" field)
      zone: adminUser.zone,
      district: adminUser.district,
      subdistrict: adminUser.subdistrict,
      localBody: adminUser.localBody,
      ward: adminUser.ward, // ✅ Admin's ward field
    };
  }

  // ✅ TRY EXECUTIVE
  const executive = await ctx.db
    .query("executives")
    .withIndex("by_convexId", (q: any) => q.eq("convexId", authUserId))
    .first();

  if (executive) {
    console.log("Fetched executive user:", executive);

    // Check if active
    if (!executive.isActive) {
      console.log("Executive isActive:", executive.isActive);
      throw new Error("Account is deactivated");
    }

    // Get hierarchy info (optional)
    const hierarchy = executive.hierarchyId
      ? await ctx.db.get(executive.hierarchyId)
      : null;

    // ✅ Build hierarchy path - use wardId for executives
    const hierarchyPath =
      hierarchy?.pathString ||
      [
        executive.zone,
        executive.district,
        executive.subdistrict,
        executive.localBody,
        executive.wardId,
      ]
        .filter(Boolean)
        .join("/") ||
      "";

    // Get rootId
    const rootId = hierarchy?.rootId || executive.rootId;

    // ✅ Return EXECUTIVE SecurityProfile
    return {
      userId: executive._id,
      userType: "executive", // ✅ Discriminator
      rootId: rootId,
      hierarchyId: executive.hierarchyId,
      hierarchyPath: hierarchyPath,
      email: executive.email,
      name: executive.name,
      isActive: executive.isActive,

      // Geographic fields (executives use "wardId" field)
      zone: executive.zone,
      district: executive.district,
      subdistrict: executive.subdistrict,
      localBody: executive.localBody,
      wardId: executive.wardId, // ✅ Executive's wardId field (not ward)
      assignedWards: executive.assignedWards, // ✅ Multiple wards

      // Executive-specific fields
      employeeId: executive.employeeId,
      phone: executive.phone,
      managerId: executive.managerId,

      // ✅ Executives have minimal role level (for compatibility)
      roleLevel: ROLE_LEVELS.EXECUTIVE,
      roleName: "Executive",
    };
  }

  // Neither admin nor executive found
  throw new Error("User profile not found");
}

export async function getSecurityProfileOrNull(
  ctx: QueryCtx | MutationCtx
): Promise<SecurityProfile | null> {
  try {
    return await getSecurityProfile(ctx);
  } catch (error) {
    return null;
  }
}

// ============================================================================
// RBAC HELPER FUNCTIONS
// ============================================================================

/**
 * Require Super Admin (Level 12)
 * Use for critical operations: user management, system settings, etc.
 */
export function requireSuperAdmin(profile: SecurityProfile): void {
  if ((profile.roleLevel || 0) < ROLE_LEVELS.SUPER_ADMIN) {
    throw new Error("Super Admin access required");
  }
}

/**
 * Require minimum role level
 * Use for operations that need specific hierarchy levels
 * 
 * ✅ UPDATED: Works with both admin and executive users
 * 
 * @example
const profile = await requireMinimumRole(ctx, ROLE_LEVELS.DISTRICT_MANAGER);
*/
export async function requireMinimumRole(
  ctx: QueryCtx | MutationCtx,
  minRoleLevel: number
): Promise<SecurityProfile> {
  const profile = await getSecurityProfile(ctx);

  const userRoleLevel = profile.roleLevel || 0;

  if (userRoleLevel < minRoleLevel) {
    throw new Error(
      `Insufficient permissions. Required: ${minRoleLevel}, Have: ${userRoleLevel}`
    );
  }

  return profile;
}

/**
 * Check if user has specific role level
 */
export function hasRoleLevel(
  profile: SecurityProfile,
  requiredLevel: number
): boolean {
  return (profile.roleLevel || 0) >= requiredLevel;
}

/**
 * Check if user is in specific role
 */
export function isInRole(profile: SecurityProfile, roleName: string): boolean {
  return profile.roleName === roleName;
}

// ============================================================================
// HIERARCHY HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a target is within user's hierarchy
 * Returns true if target is in user's subtree
 *
 * @example
 * User path: "KL/ZONE_NORTHERN/DISTRICT_KASARAGOD/"
 * Target path: "KL/ZONE_NORTHERN/DISTRICT_KASARAGOD/TALUK_KASARAGOD/"
 * Result: true (target is within user's hierarchy)
 */
export function isInHierarchy(targetPath: string, userPath: string): boolean {
  return targetPath.startsWith(userPath);
}

/**
 * Check if user can access a specific rootId
 */
export function canAccessRoot(
  profile: SecurityProfile,
  rootId: string
): boolean {
  return profile.rootId === rootId;
}

/**
 * Check if user can access a specific hierarchy
 * Combines rootId check and hierarchy path check
 */
export function canAccessHierarchy(
  profile: SecurityProfile,
  targetRootId: string,
  targetPath: string
): boolean {
  return (
    profile.rootId === targetRootId &&
    isInHierarchy(targetPath, profile.hierarchyPath)
  );
}

/**
 * Build hierarchy path for new entities
 * Appends a segment to parent path
 *
 * @example
 * buildHierarchyPath("KL/ZONE_NORTHERN/", "DISTRICT_KASARAGOD")
 * Returns: "KL/ZONE_NORTHERN/DISTRICT_KASARAGOD/"
 */
export function buildHierarchyPath(
  parentPath: string,
  segment: string
): string {
  const normalizedParent = parentPath.endsWith("/")
    ? parentPath
    : `${parentPath}/`;
  return `${normalizedParent}${segment}/`;
}

/**
 * Extract hierarchy level from path
 * Counts the number of segments (slashes)
 */
export function getHierarchyLevel(path: string): number {
  return path.split("/").filter((segment) => segment.length > 0).length;
}

/**
 * Get parent path from hierarchy path
 *
 * @example
 * getParentPath("KL/ZONE_NORTHERN/DISTRICT_KASARAGOD/")
 * Returns: "KL/ZONE_NORTHERN/"
 */
export function getParentPath(path: string): string | null {
  const segments = path.split("/").filter((segment) => segment.length > 0);

  if (segments.length <= 1) {
    return null;
  }

  segments.pop();
  return segments.join("/") + "/";
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate that user can modify a resource
 * Checks both hierarchy access and minimum role level
 */
export function validateResourceAccess(
  profile: SecurityProfile,
  resourceRootId: string,
  resourceHierarchyPath: string,
  minRoleLevel: number
): void {
  if (!canAccessRoot(profile, resourceRootId)) {
    throw new Error("Access denied: Different organization");
  }

  if (!isInHierarchy(resourceHierarchyPath, profile.hierarchyPath)) {
    throw new Error("Access denied: Outside your hierarchy");
  }

  if ((profile.roleLevel || 0) < minRoleLevel) {
    throw new Error(
      `Access denied: Minimum role level ${minRoleLevel} required`
    );
  }
}

/**
 * Validate that user can create resources at a hierarchy level
 */
export function validateCanCreateAt(
  profile: SecurityProfile,
  targetRootId: string,
  targetParentPath: string,
  minRoleLevel: number
): void {
  if (!canAccessRoot(profile, targetRootId)) {
    throw new Error("Cannot create in different organization");
  }

  if (!isInHierarchy(targetParentPath, profile.hierarchyPath)) {
    throw new Error("Cannot create outside your hierarchy");
  }

  if ((profile.roleLevel || 0) < minRoleLevel) {
    throw new Error(
      `Insufficient permissions: Minimum role level ${minRoleLevel} required`
    );
  }
}

// ============================================================================
// COMMON VALIDATORS (for Convex args)
// ============================================================================

export const hierarchyPathValidator = v.string();
export const rootIdValidator = v.string();
export const roleLevelValidator = v.number();
export const hierarchyIdValidator = v.id("hierarchies");

// ============================================================================
// ROLE LEVEL CONSTANTS - UPDATED FOR NEW STRUCTURE
// ============================================================================

/**
 * Role level hierarchy (1-12)
 * Higher number = more permissions
 * ✅ UPDATED: New granular ward-level roles
 */
export const ROLE_LEVELS = {
  EXECUTIVE: 1,
  WARD_MANAGER: 2,
  WARD_TEAM_LEADER: 3,
  LOCAL_BODY_MANAGER: 4,
  SUBDISTRICT_MANAGER: 5,
  DISTRICT_MANAGER: 6,
  ZONAL_MANAGER: 8,
  STATE_HEAD: 10,
  SUPER_ADMIN: 12,
} as const;

/**
 * Role names mapped to levels - ✅ NEW STRUCTURE
 */
export const ROLE_NAMES = {
  1: "Executive",
  2: "Ward Manager",
  3: "Ward Team Leader",
  4: "Local Body Manager",
  5: "Subdistrict Manager",
  6: "District Manager",
  8: "Zonal Manager",
  10: "State Head",
  12: "Super Admin",
} as const;

/**
 * Reverse mapping: Role name to level - ✅ UPDATED
 */
export const ROLE_NAME_TO_LEVEL: Record<string, number> = {
  Executive: 1,
  "Ward Manager": 2,
  "Ward Team Leader": 3,
  "Local Body Manager": 4,
  "Subdistrict Manager": 5,
  "District Manager": 6,
  "Zonal Manager": 8,
  "State Head": 10,
  "Super Admin": 12,
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type RoleLevel = (typeof ROLE_LEVELS)[keyof typeof ROLE_LEVELS];
export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];
