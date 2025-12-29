import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '@/core/services/auth.service';
import { LocationTrackingService } from '../services/location-tracking.service';
import { ExecutiveLocation, FilterOption } from '../interfaces/location.interface';
import { MultiSelectModule } from 'primeng/multiselect';
import { FormsModule } from '@angular/forms';
import { Select } from "primeng/select";

@Component({
  selector: 'app-location-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TableModule,
    ButtonModule,
    TagModule,
    InputTextModule,
    CardModule,
    SkeletonModule,
    TooltipModule,
    MultiSelectModule,
    FormsModule,
    Select
],
  templateUrl: './location-list.component.html',
  styleUrls: ['location-list.component.scss'],
})
export class LocationListComponent implements OnInit {
  private locationService = inject(LocationTrackingService);
  private authService = inject(AuthService);

  locations = signal<ExecutiveLocation[]>([]);
  filteredLocations = signal<ExecutiveLocation[]>([]);
  isLoading = signal(false);
  searchValue = signal('');
  isLoadingFilters = signal(true);
  currentUser = this.authService.currentUser;

  selectedZone = signal<string | null>(null);
  selectedDistrict = signal<string | null>(null);
  selectedSubdistrict = signal<string | null>(null);
  
  zoneOptions = signal<FilterOption[]>([]);
  districtOptions = signal<FilterOption[]>([]);
  subdistrictOptions = signal<FilterOption[]>([]);
  
  showFilters = signal(true);

  async ngOnInit() {
    await this.loadFilterOptions();
  }

  async loadFilterOptions() {
    this.isLoadingFilters.set(true);
    try {
      // ✅ Load zones first
      const zones = await this.locationService.getZones();
      this.zoneOptions.set(zones);

      console.log('✅ Zones loaded:', zones.length);
    } catch (error) {
      console.error('Failed to load filter options:', error);
    } finally {
      this.isLoadingFilters.set(false);
    }
  }

  // ✅ NEW: Handle zone selection change
async onZoneChange(zone: string | null) {
    this.selectedZone.set(zone);
    
    // Clear dependent filters
    this.selectedDistrict.set(null);
    this.selectedSubdistrict.set(null);
    this.districtOptions.set([]);
    this.subdistrictOptions.set([]);

    if (zone) {
      try {
        const districts = await this.locationService.getDistricts(zone);
        this.districtOptions.set(districts);
        console.log('✅ Districts loaded for zone:', zone, '→', districts.length);
      } catch (error) {
        console.error('Failed to load districts:', error);
      }
    }
  }
  // ✅ NEW: Handle district selection change
async onDistrictChange(district: string | null) {
    this.selectedDistrict.set(district);
    
    // Clear subdistricts
    this.selectedSubdistrict.set(null);
    this.subdistrictOptions.set([]);

    if (district && this.selectedZone()) {
      try {
        const subdistricts = await this.locationService.getSubdistricts(
          this.selectedZone()!,
          district
        );
        this.subdistrictOptions.set(subdistricts);
        console.log('✅ Subdistricts loaded:', subdistricts.length);
      } catch (error) {
        console.error('Failed to load subdistricts:', error);
      }
    }
  }

async applyFilters() {
    const zone = this.selectedZone();
    const district = this.selectedDistrict();
    const subdistrict = this.selectedSubdistrict();

    if (!zone && !district && !subdistrict) {
      alert('⚠️ Please select at least one filter');
      return;
    }

    await this.loadLocations();
  }
clearFilters() {
    this.selectedZone.set(null);
    this.selectedDistrict.set(null);
    this.selectedSubdistrict.set(null);
    this.districtOptions.set([]);
    this.subdistrictOptions.set([]);
    this.locations.set([]);
    this.filteredLocations.set([]);
  }
async loadLocations() {
    this.isLoading.set(true);
    try {
      const user = this.currentUser();
      if (!user?.rootId) {
        throw new Error('User not authenticated');
      }

      // ✅ Convert single values to arrays for backend
      const zones = this.selectedZone() ? [this.selectedZone()!] : [];
      const districts = this.selectedDistrict() ? [this.selectedDistrict()!] : [];
      const subdistricts = this.selectedSubdistrict() ? [this.selectedSubdistrict()!] : [];

      const response = await this.locationService.getLiveExecutiveLocationsFiltered(
        user.rootId,
        { zones, districts, subdistricts }
      );

      this.locations.set(response.locations);
      this.filteredLocations.set(response.locations);
      
      console.log(`✅ Loaded ${response.locations.length} locations`);
    } catch (error) {
      console.error('Failed to load locations:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchValue.set(value);

    if (!value) {
      this.filteredLocations.set(this.locations());
      return;
    }

    const filtered = this.locations().filter(
      (loc) =>
        loc.executiveName.toLowerCase().includes(value) ||
        loc.employeeId.toLowerCase().includes(value)
    );
    this.filteredLocations.set(filtered);
  }

  getTimeSince(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 24) return `${Math.floor(hours / 24)} days ago`;
    if (hours > 0) return `${hours} hours ago`;
    if (minutes > 0) return `${minutes} minutes ago`;
    return 'Just now';
  }

  getBatteryColor(level?: number): 'success' | 'secondary' | 'info' | 'warn' | 'danger' {
    if (!level) return 'info';
    if (level < 20) return 'danger';
    if (level < 50) return 'warn';
    return 'success';
  }

  formatCoordinates(lat: number, lng: number): string {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }

  openInMaps(lat: number, lng: number) {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  }
}