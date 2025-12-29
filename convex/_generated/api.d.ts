/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as _lib_executive_helpers from "../_lib/executive_helpers.js";
import type * as _lib_geoFilters from "../_lib/geoFilters.js";
import type * as _lib_security from "../_lib/security.js";
import type * as _lib_security_safe from "../_lib/security_safe.js";
import type * as analytics_cleanup from "../analytics/cleanup.js";
import type * as analytics_crons from "../analytics/crons.js";
import type * as analytics_dashboard from "../analytics/dashboard.js";
import type * as attendance_mutation from "../attendance/mutation.js";
import type * as attendance_queries from "../attendance/queries.js";
import type * as auth from "../auth.js";
import type * as auth_db from "../auth_db.js";
import type * as crons_cron_main from "../crons/cron_main.js";
import type * as executives_internal from "../executives/internal.js";
import type * as executives_mutation from "../executives/mutation.js";
import type * as executives_queries from "../executives/queries.js";
import type * as files from "../files.js";
import type * as hierarchies_hierarchies from "../hierarchies/hierarchies.js";
import type * as hr_applications from "../hr/applications.js";
import type * as hr_crons from "../hr/crons.js";
import type * as hr_jobs from "../hr/jobs.js";
import type * as hr_pipeline from "../hr/pipeline.js";
import type * as http from "../http.js";
import type * as integrations_googleSheets from "../integrations/googleSheets.js";
import type * as internal_seed from "../internal/seed.js";
import type * as location_admin_queries from "../location/admin/queries.js";
import type * as location_mutation from "../location/mutation.js";
import type * as location_queries from "../location/queries.js";
import type * as notifications_tasks from "../notifications/tasks.js";
import type * as publichttp from "../publichttp.js";
import type * as reports_mutation from "../reports/mutation.js";
import type * as reports_queries from "../reports/queries.js";
import type * as secureAuth_actions from "../secureAuth/actions.js";
import type * as secureAuth_mutations from "../secureAuth/mutations.js";
import type * as seed_districtwiseusers_kasargod_seedKasaragodSubdistricts from "../seed/districtwiseusers/kasargod/seedKasaragodSubdistricts.js";
import type * as seed_districtwiseusers_kasargod_seedKasaragod_Executives from "../seed/districtwiseusers/kasargod/seedKasaragod_Executives.js";
import type * as seed_districtwiseusers_kasargod_seedKasaragod_LocalBodies from "../seed/districtwiseusers/kasargod/seedKasaragod_LocalBodies.js";
import type * as seed_districtwiseusers_kasargod_seedKasaragod_WardManagers from "../seed/districtwiseusers/kasargod/seedKasaragod_WardManagers.js";
import type * as seed_districtwiseusers_trivandrum_seedApprovalRequests from "../seed/districtwiseusers/trivandrum/seedApprovalRequests.js";
import type * as seed_districtwiseusers_trivandrum_seedTrivandrum_Executives from "../seed/districtwiseusers/trivandrum/seedTrivandrum_Executives.js";
import type * as seed_districtwiseusers_trivandrum_seedTrivandrum_LocalBodyManagers from "../seed/districtwiseusers/trivandrum/seedTrivandrum_LocalBodyManagers.js";
import type * as seed_districtwiseusers_trivandrum_seedTrivandrum_SubdistrictManagers from "../seed/districtwiseusers/trivandrum/seedTrivandrum_SubdistrictManagers.js";
import type * as seed_districtwiseusers_trivandrum_seedTrivandrum_Tasks from "../seed/districtwiseusers/trivandrum/seedTrivandrum_Tasks.js";
import type * as seed_districtwiseusers_trivandrum_seedTrivandrum_Training from "../seed/districtwiseusers/trivandrum/seedTrivandrum_Training.js";
import type * as seed_districtwiseusers_trivandrum_seedTrivandrum_Training_Progress from "../seed/districtwiseusers/trivandrum/seedTrivandrum_Training_Progress.js";
import type * as seed_districtwiseusers_trivandrum_seedTrivandrum_Training_Quizzes from "../seed/districtwiseusers/trivandrum/seedTrivandrum_Training_Quizzes.js";
import type * as seed_districtwiseusers_trivandrum_seedTrivandrum_WardManagers from "../seed/districtwiseusers/trivandrum/seedTrivandrum_WardManagers.js";
import type * as seed_hierarchy_seedHierarchies from "../seed/hierarchy/seedHierarchies.js";
import type * as seed_internal from "../seed/internal.js";
import type * as seed_users_admin_admin from "../seed/users/admin/admin.js";
import type * as seed_users_zoneanddistrict_seedZonalsAndDistricts from "../seed/users/zoneanddistrict/seedZonalsAndDistricts.js";
import type * as setup_cleanup from "../setup/cleanup.js";
import type * as setup_importWards from "../setup/importWards.js";
import type * as setup_importWardsMutations from "../setup/importWardsMutations.js";
import type * as store__lib from "../store/_lib.js";
import type * as store_crons from "../store/crons.js";
import type * as store_executive_mutations from "../store/executive/mutations.js";
import type * as store_executive_queries from "../store/executive/queries.js";
import type * as store_orders from "../store/orders.js";
import type * as store_payments from "../store/payments.js";
import type * as store_products from "../store/products.js";
import type * as system_cron from "../system/cron.js";
import type * as system_settings from "../system/settings.js";
import type * as tasks__lib from "../tasks/_lib.js";
import type * as tasks_admin_mutation from "../tasks/admin/mutation.js";
import type * as tasks_admin_queries from "../tasks/admin/queries.js";
import type * as tasks_internal from "../tasks/internal.js";
import type * as tasks_me_mutation from "../tasks/me/mutation.js";
import type * as tasks_me_queries from "../tasks/me/queries.js";
import type * as training__lib from "../training/_lib.js";
import type * as training_certificates from "../training/certificates.js";
import type * as training_courses from "../training/courses.js";
import type * as training_cron from "../training/cron.js";
import type * as training_executive_mutations from "../training/executive/mutations.js";
import type * as training_executive_progress from "../training/executive/progress.js";
import type * as training_executive_queries from "../training/executive/queries.js";
import type * as training_executive_quiz from "../training/executive/quiz.js";
import type * as training_progress from "../training/progress.js";
import type * as training_quizzes from "../training/quizzes.js";
import type * as users__lib from "../users/_lib.js";
import type * as users_admin_actions from "../users/admin/actions.js";
import type * as users_admin_lookups from "../users/admin/lookups.js";
import type * as users_admin_mutations from "../users/admin/mutations.js";
import type * as users_admin_queries from "../users/admin/queries.js";
import type * as users_internal from "../users/internal.js";
import type * as users_me_mutation from "../users/me/mutation.js";
import type * as users_me_queries from "../users/me/queries.js";
import type * as wards from "../wards.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "_lib/executive_helpers": typeof _lib_executive_helpers;
  "_lib/geoFilters": typeof _lib_geoFilters;
  "_lib/security": typeof _lib_security;
  "_lib/security_safe": typeof _lib_security_safe;
  "analytics/cleanup": typeof analytics_cleanup;
  "analytics/crons": typeof analytics_crons;
  "analytics/dashboard": typeof analytics_dashboard;
  "attendance/mutation": typeof attendance_mutation;
  "attendance/queries": typeof attendance_queries;
  auth: typeof auth;
  auth_db: typeof auth_db;
  "crons/cron_main": typeof crons_cron_main;
  "executives/internal": typeof executives_internal;
  "executives/mutation": typeof executives_mutation;
  "executives/queries": typeof executives_queries;
  files: typeof files;
  "hierarchies/hierarchies": typeof hierarchies_hierarchies;
  "hr/applications": typeof hr_applications;
  "hr/crons": typeof hr_crons;
  "hr/jobs": typeof hr_jobs;
  "hr/pipeline": typeof hr_pipeline;
  http: typeof http;
  "integrations/googleSheets": typeof integrations_googleSheets;
  "internal/seed": typeof internal_seed;
  "location/admin/queries": typeof location_admin_queries;
  "location/mutation": typeof location_mutation;
  "location/queries": typeof location_queries;
  "notifications/tasks": typeof notifications_tasks;
  publichttp: typeof publichttp;
  "reports/mutation": typeof reports_mutation;
  "reports/queries": typeof reports_queries;
  "secureAuth/actions": typeof secureAuth_actions;
  "secureAuth/mutations": typeof secureAuth_mutations;
  "seed/districtwiseusers/kasargod/seedKasaragodSubdistricts": typeof seed_districtwiseusers_kasargod_seedKasaragodSubdistricts;
  "seed/districtwiseusers/kasargod/seedKasaragod_Executives": typeof seed_districtwiseusers_kasargod_seedKasaragod_Executives;
  "seed/districtwiseusers/kasargod/seedKasaragod_LocalBodies": typeof seed_districtwiseusers_kasargod_seedKasaragod_LocalBodies;
  "seed/districtwiseusers/kasargod/seedKasaragod_WardManagers": typeof seed_districtwiseusers_kasargod_seedKasaragod_WardManagers;
  "seed/districtwiseusers/trivandrum/seedApprovalRequests": typeof seed_districtwiseusers_trivandrum_seedApprovalRequests;
  "seed/districtwiseusers/trivandrum/seedTrivandrum_Executives": typeof seed_districtwiseusers_trivandrum_seedTrivandrum_Executives;
  "seed/districtwiseusers/trivandrum/seedTrivandrum_LocalBodyManagers": typeof seed_districtwiseusers_trivandrum_seedTrivandrum_LocalBodyManagers;
  "seed/districtwiseusers/trivandrum/seedTrivandrum_SubdistrictManagers": typeof seed_districtwiseusers_trivandrum_seedTrivandrum_SubdistrictManagers;
  "seed/districtwiseusers/trivandrum/seedTrivandrum_Tasks": typeof seed_districtwiseusers_trivandrum_seedTrivandrum_Tasks;
  "seed/districtwiseusers/trivandrum/seedTrivandrum_Training": typeof seed_districtwiseusers_trivandrum_seedTrivandrum_Training;
  "seed/districtwiseusers/trivandrum/seedTrivandrum_Training_Progress": typeof seed_districtwiseusers_trivandrum_seedTrivandrum_Training_Progress;
  "seed/districtwiseusers/trivandrum/seedTrivandrum_Training_Quizzes": typeof seed_districtwiseusers_trivandrum_seedTrivandrum_Training_Quizzes;
  "seed/districtwiseusers/trivandrum/seedTrivandrum_WardManagers": typeof seed_districtwiseusers_trivandrum_seedTrivandrum_WardManagers;
  "seed/hierarchy/seedHierarchies": typeof seed_hierarchy_seedHierarchies;
  "seed/internal": typeof seed_internal;
  "seed/users/admin/admin": typeof seed_users_admin_admin;
  "seed/users/zoneanddistrict/seedZonalsAndDistricts": typeof seed_users_zoneanddistrict_seedZonalsAndDistricts;
  "setup/cleanup": typeof setup_cleanup;
  "setup/importWards": typeof setup_importWards;
  "setup/importWardsMutations": typeof setup_importWardsMutations;
  "store/_lib": typeof store__lib;
  "store/crons": typeof store_crons;
  "store/executive/mutations": typeof store_executive_mutations;
  "store/executive/queries": typeof store_executive_queries;
  "store/orders": typeof store_orders;
  "store/payments": typeof store_payments;
  "store/products": typeof store_products;
  "system/cron": typeof system_cron;
  "system/settings": typeof system_settings;
  "tasks/_lib": typeof tasks__lib;
  "tasks/admin/mutation": typeof tasks_admin_mutation;
  "tasks/admin/queries": typeof tasks_admin_queries;
  "tasks/internal": typeof tasks_internal;
  "tasks/me/mutation": typeof tasks_me_mutation;
  "tasks/me/queries": typeof tasks_me_queries;
  "training/_lib": typeof training__lib;
  "training/certificates": typeof training_certificates;
  "training/courses": typeof training_courses;
  "training/cron": typeof training_cron;
  "training/executive/mutations": typeof training_executive_mutations;
  "training/executive/progress": typeof training_executive_progress;
  "training/executive/queries": typeof training_executive_queries;
  "training/executive/quiz": typeof training_executive_quiz;
  "training/progress": typeof training_progress;
  "training/quizzes": typeof training_quizzes;
  "users/_lib": typeof users__lib;
  "users/admin/actions": typeof users_admin_actions;
  "users/admin/lookups": typeof users_admin_lookups;
  "users/admin/mutations": typeof users_admin_mutations;
  "users/admin/queries": typeof users_admin_queries;
  "users/internal": typeof users_internal;
  "users/me/mutation": typeof users_me_mutation;
  "users/me/queries": typeof users_me_queries;
  wards: typeof wards;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
