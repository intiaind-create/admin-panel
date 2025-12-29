export interface Ward {
  _id: string;
  wardName: string;
  wardCode?: string;
  localBodyName: string;
  localBodyType: 'P' | 'M' | 'C';
  district: string;
  subdistrict: string;
  zone: string;
  state: string;
  rootId: string;
  population?: number;
  totalApplications?: number;
  totalHires?: number;
  createdAt: number;
  updatedAt: number;
}


export interface LocationFilterState {
  zone: string | null;
  district: string | null;
  subdistrict: string | null;
  localBodyType: 'P' | 'M' | 'C' | null;
  localBodyName: string | null;
  wardId: string | null;
}