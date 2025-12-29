import { ConvexService } from "../../../core/services/convex.service";
import { inject, signal, Injectable } from "@angular/core";
import { api } from "convex/_generated/api";



export interface LocationFilterState {
  zone: string | null;
  district: string | null;
  subdistrict: string | null;
  localBodyType: 'P' | 'M' | 'C' | null;
  localBodyName: string | null;
  wardId: string | null;
}

interface OptionItem {
  value: string;
  label: string;
}

@Injectable({
  providedIn: 'root'
})
export class WardsService {
  private readonly convex = inject(ConvexService);
  
  // ✅ No need to store all wards - use backend queries directly
  private readonly _rootId = signal<string>('');

  // ✅ Filter state signals (cascading behavior)
  readonly selectedZone = signal<string | null>(null);
  readonly selectedDistrict = signal<string | null>(null);
  readonly selectedSubdistrict = signal<string | null>(null);
  readonly selectedLocalBodyType = signal<'P' | 'M' | 'C' | null>(null);
  readonly selectedLocalBodyName = signal<string | null>(null);
  readonly selectedWardId = signal<string | null>(null);

  /**
   * Set rootId from auth context
   */
  setRootId(rootId: string): void {
    this._rootId.set(rootId);
  }

  /**
   * Get zones (hardcoded for performance)
   */
  async getZones(): Promise<OptionItem[]> {
    return await this.convex.client.query(api.wards.getZones, {});
  }

  /**
   * Get districts for selected zone
   */
  async getDistricts(zone?: string): Promise<OptionItem[]> {
    return await this.convex.client.query(api.wards.getDistricts, {
      zone: zone || undefined
    });
  }

  /**
   * Get subdistricts
   */
  async getSubdistricts(zone?: string, district?: string): Promise<OptionItem[]> {
    return await this.convex.client.query(api.wards.getSubdistricts, {
      zone: zone || undefined,
      district: district || undefined
    });
  }

  /**
   * Get local body types (P/M/C)
   */
  async getLocalBodyTypes(): Promise<OptionItem[]> {
    return await this.convex.client.query(api.wards.getLocalBodyTypes, {});
  }

  /**
   * Get local bodies
   */
  async getLocalBodies(
    zone?: string,
    district?: string,
    subdistrict?: string,
    localBodyType?: string
  ): Promise<OptionItem[]> {
    return await this.convex.client.query(api.wards.getLocalBodies, {
      zone: zone || undefined,
      district: district || undefined,
      subdistrict: subdistrict || undefined,
      localBodyType: localBodyType || undefined
    });
  }

  /**
   * Get wards (with limit for performance)
   */
  async getWards(
    zone?: string,
    district?: string,
    subdistrict?: string,
    localBodyName?: string,
    limit: number = 500
  ): Promise<OptionItem[]> {
    return await this.convex.client.query(api.wards.getWards, {
      zone: zone || undefined,
      district: district || undefined,
      subdistrict: subdistrict || undefined,
      localBodyName: localBodyName || undefined,
      limit
    });
  }

  /**
   * Get current filter state as object
   */
  getFilterState(): LocationFilterState {
    return {
      zone: this.selectedZone(),
      district: this.selectedDistrict(),
      subdistrict: this.selectedSubdistrict(),
      localBodyType: this.selectedLocalBodyType(),
      localBodyName: this.selectedLocalBodyName(),
      wardId: this.selectedWardId(),
    };
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.selectedZone.set(null);
    this.selectedDistrict.set(null);
    this.selectedSubdistrict.set(null);
    this.selectedLocalBodyType.set(null);
    this.selectedLocalBodyName.set(null);
    this.selectedWardId.set(null);
  }

  /**
   * Validate ward selection (useful for form submission)
   */
  isValidWardSelection(): boolean {
    return !!(
      this.selectedZone() &&
      this.selectedDistrict() &&
      this.selectedSubdistrict() &&
      this.selectedLocalBodyName() &&
      this.selectedWardId()
    );
  }
}
