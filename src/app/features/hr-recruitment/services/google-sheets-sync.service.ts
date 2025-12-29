import { ConvexService } from "@/core/services/convex.service";
import { inject, signal, computed, DestroyRef } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { api } from "convex/_generated/api";
import { catchError, from, interval, of, startWith, switchMap } from "rxjs";
import { ManualSyncResult, SyncState } from "../interfaces/google-sheet.interface";

export class GoogleSheetsSyncService {
  private readonly convex = inject(ConvexService);
  private readonly destroyRef = inject(DestroyRef);

  // ✅ Signals for reactive state
  private readonly _rootId = signal<string>('');
  private readonly _pollingEnabled = signal(false);
  private readonly _syncStateData = signal<SyncState | null>(null);

  // ✅ Use ConvexClient.query() in an Observable stream
  private readonly syncStateQuery$ = interval(5000).pipe(
    startWith(0),
    switchMap(() => {
      const rootId = this._rootId();
      if (!rootId || !this._pollingEnabled()) return of(null);
      
      // ✅ Use client.query() - returns Promise
      return from(
        this.convex.client.query(
          api.integrations.googleSheets.getSyncStatusPublic,
          { rootId }
        )
      ).pipe(
        catchError(err => {
          console.error('Sync state query error:', err);
          return of(null);
        })
      );
    })
  );

  // ✅ Convert Observable to Signal
  readonly syncState = toSignal(this.syncStateQuery$, { 
    initialValue: null 
  });

  // ✅ Computed signals for derived state
  readonly isSyncing = computed(() => 
    this.syncState()?.status === 'syncing'
  );

  readonly hasErrors = computed(() => 
    this.syncState()?.status === 'failed'
  );

  readonly syncProgress = computed(() => {
    const state = this.syncState();
    if (!state) return 0;
    const total = state.totalSynced + state.totalFailed;
    return total > 0 ? (state.totalSynced / total) * 100 : 0;
  });

  readonly lastSyncFormatted = computed(() => {
    const state = this.syncState();
    if (!state?.lastSyncTime) return 'Never';
    
    const date = new Date(state.lastSyncTime);
    const now = Date.now();
    const diff = now - state.lastSyncTime;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  });

  /**
   * Initialize service with rootId from auth context
   */
  setRootId(rootId: string): void {
    this._rootId.set(rootId);
  }

  /**
   * Enable/disable auto-refresh polling
   */
  enablePolling(enabled: boolean): void {
    this._pollingEnabled.set(enabled);
  }

  /**
   * Trigger manual sync
   */
  async triggerManualSync(
    spreadsheetId: string,
    force = false
  ): Promise<ManualSyncResult> {
    const rootId = this._rootId();
    if (!rootId) {
      throw new Error('RootId not set. Call setRootId() first.');
    }

    // ✅ Use client.mutation() - returns Promise
    return await this.convex.client.mutation(
      api.integrations.googleSheets.triggerManualSync,
      { spreadsheetId, rootId, force }
    );
  }

  /**
   * Force full resync (starts from row 2)
   */
  async forceFullResync(spreadsheetId: string): Promise<ManualSyncResult> {
    return this.triggerManualSync(spreadsheetId, true);
  }

  /**
   * Get import statistics (one-time query)
   */
  async getImportStats(): Promise<{
    totalApplications: number;
    lastImportDate: Date | null;
    errorCount: number;
  }> {
    const state = this.syncState();
    
    return {
      totalApplications: state?.totalSynced || 0,
      lastImportDate: state?.lastSyncTime ? new Date(state.lastSyncTime) : null,
      errorCount: state?.totalFailed || 0,
    };
  }
}