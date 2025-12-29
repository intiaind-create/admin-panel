import { LocationFilterState } from "./wards.interface";

export interface JobApplication {
  _id: string;
  name: string;
  email: string;
  phone: string;
  rootId: string;
  jobPostingId: string;
  status: 'applied' | 'shortlisted' | 'interviewed' | 'selected' | 'rejected';
  experience: number;
  
  // Location fields
  zone?: string;
  district?: string;
  subdistrict?: string;
  localBodyName?: string;
  localBodyType?: 'P' | 'M' | 'C';
  wardName?: string;
  wardId?: string;
  
  // Additional fields
  coverLetter?: string;
  source?: string;
  googleSheetRowNumber?: number;
  createdAt: number;
  updatedAt: number;
}

export interface ApplicationFilters extends LocationFilterState {
  jobPostingId: string | null;
  status: JobApplication['status'] | null;
  searchQuery: string | null;
  dateFrom: number | null;
  dateTo: number | null;
}

export interface ApplicationsResponse {
  items: JobApplication[];
  total: number;
}

export interface ApplicationStats {
  totalApplications: number;
  byStatus: Record<string, number>;
  byZone: Record<string, number>;
  byDistrict: Record<string, number>;
  conversionRate: number;
}
