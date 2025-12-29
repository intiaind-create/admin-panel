export interface ExecutiveLocation {
  executiveId: string;
  executiveName: string;
  employeeId: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
  batteryLevel?: number;
  isMoving?: boolean;
}

export interface LocationTrail {
  executiveName: string;
  employeeId: string;
  locations: TrailPoint[];
  continueCursor?: string;
  isDone: boolean;
}

export interface TrailPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
  batteryLevel?: number;
  isMoving?: boolean;
}

export interface LiveMapResponse {
  locations: ExecutiveLocation[];
  continueCursor?: string;
  isDone: boolean;
}

export interface FilterOption {
  label: string;
  value: string;
}