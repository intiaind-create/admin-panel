import { Injectable, inject } from '@angular/core';
import { ConvexService } from '../../../core/services/convex.service';
import { ExecutiveLocation, LocationTrail, LiveMapResponse } from '../interfaces/location.interface';
import { api } from 'convex/_generated/api';

interface FilterOption {
  value: string;
  label: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocationTrackingService {
  private convex = inject(ConvexService);

  // ✅ Load filter options from wards
  async getZones(): Promise<FilterOption[]> {
    return await this.convex.query<FilterOption[]>(
      api.wards.getZones,
      {}
    );
  }

  async getDistricts(zone?: string): Promise<FilterOption[]> {
    return await this.convex.query<FilterOption[]>(
      api.wards.getDistricts,
      { zone }
    );
  }

  async getSubdistricts(zone?: string, district?: string): Promise<FilterOption[]> {
    return await this.convex.query<FilterOption[]>(
      api.wards.getSubdistricts,
      { zone, district }
    );
  }

  // ✅ Load locations with filters
  async getLiveExecutiveLocationsFiltered(
    rootId: string,
    filters: {
      zones?: string[];
      districts?: string[];
      subdistricts?: string[];
    },
    cursor?: string
  ): Promise<LiveMapResponse> {
    return await this.convex.query<LiveMapResponse>(
      api.location.admin.queries.getLiveExecutiveLocationsFiltered,
      { rootId, filters, cursor }
    );
  }

  async getExecutiveLocationTrail(
    executiveId: string,
    cursor?: string,
    hours?: number
  ): Promise<LocationTrail> {
    return await this.convex.query<LocationTrail>(
      api.location.admin.queries.getExecutiveLocationTrail,
      { executiveId, cursor, hours }
    );
  }

  async getExecutiveLatestLocation(
    executiveId: string
  ): Promise<ExecutiveLocation | null> {
    return await this.convex.query<ExecutiveLocation | null>(
      api.location.admin.queries.getExecutiveLatestLocation,
      { executiveId }
    );
  }

  async getExecutivesInArea(
    rootId: string,
    centerLat: number,
    centerLng: number,
    radiusKm: number
  ): Promise<ExecutiveLocation[]> {
    return await this.convex.query<ExecutiveLocation[]>(
      api.location.admin.queries.getExecutivesInArea,
      { rootId, centerLat, centerLng, radiusKm }
    );
  }
}