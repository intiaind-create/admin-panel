import { Injectable } from '@angular/core';
import { ConvexService } from '../../core/services/convex.service';
import { api } from 'convex/_generated/api';
import { AuthService } from '../../core/services/auth.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(
    private convexService: ConvexService,
    private authService: AuthService
  ) {}

  // ✅ FIXED: No rootCode argument - uses authenticated user's context
  // async getAdminDashboardSummary() {
  //   const currentUser = this.authService.currentUser();
  //   if (!currentUser) {
  //     throw new Error('User not authenticated');
  //   }

  //   // Call without rootCode - the query gets it from your auth token
  //   return await this.convexService.client.query(
  //     api.users.admin.queries.getDashboardSummary,
  //     {} // Empty args - query uses authenticated user's rootId
  //   );
  // }

  // Existing methods (keep these)
  getSummary() {
    return this.convexService.client.query(
      api.tasks.me.queries.getMyTaskStats,
      {}
    );
  }

  getRecentSubmissions() {
    return this.convexService.client.query(
      api.tasks.me.queries.getMyTasks,
      { status: 'pending' }
    );
  }
}
