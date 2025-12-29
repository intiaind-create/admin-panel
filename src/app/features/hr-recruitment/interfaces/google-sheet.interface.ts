export interface SyncState {
  _id: string;
  syncType: 'applications';
  rootId: string;
  lastSyncedRow: number;
  totalSynced: number;
  totalFailed: number;
  spreadsheetId: string;
  sheetName: string;
  status: 'idle' | 'syncing' | 'completed' | 'failed';
  lastSyncTime: number;
  errorMessage?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ManualSyncResult {
  success: boolean;
  message: string;
}