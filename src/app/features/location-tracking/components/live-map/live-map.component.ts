import { Component, OnInit, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { LocationTrackingService } from '../../services/location-tracking.service';
import { AuthService } from '@/core/services/auth.service';
import { ExecutiveLocation } from '../../interfaces/location.interface';
import * as L from 'leaflet';
import 'leaflet.markercluster';

interface FilterOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-live-map',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    CardModule,
    ButtonModule,
    SkeletonModule,
    TooltipModule,
    TagModule,
    SelectModule,
  ],
  templateUrl: './live-map.component.html',
  styleUrls: ['./live-map.component.scss'],
})
export class LiveMapComponent implements OnInit, OnDestroy {
  private locationService = inject(LocationTrackingService);
  private authService = inject(AuthService);

  locations = signal<ExecutiveLocation[]>([]);
  isLoading = signal(false);
  isLoadingFilters = signal(true);
  autoRefresh = signal(false);
  
  private map?: L.Map;
  private markerClusterGroup?: L.MarkerClusterGroup;
  private refreshInterval: any;

  currentUser = this.authService.currentUser;

  // ✅ Single select filters
  selectedZone = signal<string | null>(null);
  selectedDistrict = signal<string | null>(null);
  selectedSubdistrict = signal<string | null>(null);
  
  zoneOptions = signal<FilterOption[]>([]);
  districtOptions = signal<FilterOption[]>([]);
  subdistrictOptions = signal<FilterOption[]>([]);
  
  showFilters = signal(true);

  // Marker icons
  private movingIcon = L.icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjMzBhNzJmIiBkPSJNMTIgMkM4LjEzIDIgNSA1LjEzIDUgOWMwIDUuMjUgNyAxMyA3IDEzczctNy43NSA3LTEzYzAtMy44Ny0zLjEzLTctNy03em0wIDkuNWMtMS4zOCAwLTIuNS0xLjEyLTIuNS0yLjVzMS4xMi0yLjUgMi41LTIuNSAyLjUgMS4xMiAyLjUgMi41LTEuMTIgMi41LTIuNSAyLjV6Ii8+PC9zdmc+',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  private stationaryIcon = L.icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjNjY2NjY2IiBkPSJNMTIgMkM4LjEzIDIgNSA1LjEzIDUgOWMwIDUuMjUgNyAxMyA3IDEzczctNy43NSA3LTEzYzAtMy44Ny0zLjEzLTctNy03em0wIDkuNWMtMS4zOCAwLTIuNS0xLjEyLTIuNS0yLjVzMS4xMi0yLjUgMi41LTIuNSAyLjUgMS4xMiAyLjUgMi41LTEuMTIgMi41LTIuNSAyLjV6Ii8+PC9zdmc+',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  async ngOnInit() {
    await this.loadFilterOptions();
    setTimeout(() => {
    this.initializeMap();
  }, 100);
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.map) {
      this.map.remove();
    }
  }

  async loadFilterOptions() {
    this.isLoadingFilters.set(true);
    try {
      const zones = await this.locationService.getZones();
      this.zoneOptions.set(zones);
      console.log('✅ Zones loaded:', zones.length);
    } catch (error) {
      console.error('Failed to load filter options:', error);
    } finally {
      this.isLoadingFilters.set(false);
    }
  }

  // ✅ Handle zone change
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

  // ✅ Handle district change
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
      alert('⚠️ Please select at least one filter to prevent loading all 30,000+ executives');
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
    
    if (this.map) {
      this.markerClusterGroup?.clearLayers();
    }
  }

  // ✅ Load executive LOCATIONS based on filter
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

    // ✅ Backend filters executives by zone/district/subdistrict
    // ✅ Then returns their latest location data
    const response = await this.locationService.getLiveExecutiveLocationsFiltered(
      user.rootId,
      { zones, districts, subdistricts }
    );

    console.log(`✅ Loaded ${response.locations.length} executive locations (filtered by geography)`);

    this.locations.set(response.locations);
    
    // ✅ FIXED: Initialize map even if no locations
    if (!this.map) {
      setTimeout(() => {
        this.initializeMap();
      }, 100);
    } else if (response.locations.length > 0) {
      this.addMarkers();
    } else {
      // ✅ Clear markers if no locations
      this.markerClusterGroup?.clearLayers();
    }
  } catch (error) {
    console.error('Failed to load locations:', error);
  } finally {
    this.isLoading.set(false);
  }
}
  private initializeMap() {

     console.log('🗺️ initializeMap() called');
  
  const mapElement = document.getElementById('map');
  console.log('📍 Map element found:', mapElement);
  
  if (!mapElement) {
    console.error('❌ Map element not found!');
    return;
  }

    if (!document.getElementById('map')) {
      console.error('Map container not found');
      return;
    }

    this.map = L.map('map', {
      center: [10.8505, 76.2711],
      zoom: 8,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    this.markerClusterGroup = L.markerClusterGroup({
      disableClusteringAtZoom: 15,
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        let size = 'small';
        if (count > 100) size = 'large';
        else if (count > 10) size = 'medium';

        return L.divIcon({
          html: `<div><span>${count}</span></div>`,
          className: `marker-cluster marker-cluster-${size}`,
          iconSize: L.point(40, 40),
        });
      },
    });

    this.map.addLayer(this.markerClusterGroup);

    if (this.locations().length > 0) {
      this.addMarkers();
    }
  }

  private addMarkers() {
    if (!this.map || !this.markerClusterGroup) return;

    this.markerClusterGroup.clearLayers();

    const locations = this.locations();
    if (locations.length === 0) return;

    const markers: L.Marker[] = [];
    
    // ✅ Each location has executive's lat/lng from location_logs table
    locations.forEach((exec) => {
      const marker = L.marker([exec.latitude, exec.longitude], {
        icon: exec.isMoving ? this.movingIcon : this.stationaryIcon,
      });

      const popupContent = this.createPopupContent(exec);
      marker.bindPopup(popupContent);

      markers.push(marker);
    });

    this.markerClusterGroup.addLayers(markers);

    if (locations.length === 1) {
      this.map.setView([locations[0].latitude, locations[0].longitude], 14);
    } else {
      const bounds = this.markerClusterGroup.getBounds();
      if (bounds.isValid()) {
        this.map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }

  private createPopupContent(exec: ExecutiveLocation): string {
    const battery = exec.batteryLevel
      ? `<div class="popup-row">
           <i class="pi pi-bolt"></i>
           <span class="battery-${this.getBatteryClass(exec.batteryLevel)}">
             ${exec.batteryLevel}%
           </span>
         </div>`
      : '';

    const status = exec.isMoving !== undefined
      ? `<div class="popup-row">
           <i class="pi pi-${exec.isMoving ? 'directions' : 'stop-circle'}"></i>
           <span>${exec.isMoving ? 'Moving' : 'Stationary'}</span>
         </div>`
      : '';

    return `
      <div class="location-popup">
        <h6>${exec.executiveName}</h6>
        <p class="text-muted">ID: ${exec.employeeId}</p>
        <div class="popup-row">
          <i class="pi pi-map-marker"></i>
          <span>${exec.latitude.toFixed(6)}, ${exec.longitude.toFixed(6)}</span>
        </div>
        <div class="popup-row">
          <i class="pi pi-clock"></i>
          <span>${this.getTimeSince(exec.timestamp)}</span>
        </div>
        ${battery}
        ${status}
        <div class="popup-actions">
          <a href="/location-tracking/executive/${exec.executiveId}/trail" class="popup-btn">
            <i class="pi pi-history"></i> View Trail
          </a>
          <a href="https://www.google.com/maps?q=${exec.latitude},${exec.longitude}" 
             target="_blank" class="popup-btn popup-btn-success">
            <i class="pi pi-external-link"></i> Maps
          </a>
        </div>
      </div>
    `;
  }

  toggleAutoRefresh() {
    const current = this.autoRefresh();
    this.autoRefresh.set(!current);

    if (!current) {
      this.refreshInterval = setInterval(() => {
        this.loadLocations();
      }, 30000);
    } else {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
        this.refreshInterval = null;
      }
    }
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

  getBatteryClass(level: number): string {
    if (level < 20) return 'danger';
    if (level < 50) return 'warning';
    return 'success';
  }

  getBatteryColor(level?: number): 'success' | 'secondary' | 'info' | 'warn' | 'danger' {
    if (!level) return 'info';
    if (level < 20) return 'danger';
    if (level < 50) return 'warn';
    return 'success';
  }
}
