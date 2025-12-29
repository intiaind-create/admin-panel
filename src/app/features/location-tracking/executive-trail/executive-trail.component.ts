import { Component, OnInit, signal, inject, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { TimelineModule } from 'primeng/timeline';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { LocationTrackingService } from '../services/location-tracking.service';
import { LocationTrail, TrailPoint } from '../interfaces/location.interface';
import { FormsModule } from '@angular/forms';

interface TimeRangeOption {
  label: string;
  value: number;
}

@Component({
  selector: 'app-executive-trail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    SkeletonModule,
    TooltipModule,
    TagModule,
    SelectModule,
    TimelineModule,
    FormsModule
  ],
  templateUrl: './executive-trail.component.html',
  styleUrls: ['./executive-trail.component.scss'],
})
export class ExecutiveTrailComponent implements OnInit, AfterViewInit, OnDestroy {
  private locationService = inject(LocationTrackingService);
  private route = inject(ActivatedRoute);

  executiveId = signal<string>('');
  trail = signal<LocationTrail | null>(null);
  isLoading = signal(true);
  selectedTimeRange = signal<number>(24); // Default 24 hours
  
  private map?: L.Map;
  private pathLine?: L.Polyline;
  private markers: L.Marker[] = [];

  // Time range options
  timeRangeOptions: TimeRangeOption[] = [
    { label: 'Last 6 Hours', value: 6 },
    { label: 'Last 12 Hours', value: 12 },
    { label: 'Last 24 Hours', value: 24 },
    { label: 'Last 48 Hours', value: 48 },
    { label: 'Last 7 Days', value: 168 },
  ];

  // Marker icons
  private startIcon = L.icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjMjJjNTVlIiBkPSJNMTIgMkM4LjEzIDIgNSA1LjEzIDUgOWMwIDUuMjUgNyAxMyA3IDEzczctNy43NSA3LTEzYzAtMy44Ny0zLjEzLTctNy03em0wIDkuNWMtMS4zOCAwLTIuNS0xLjEyLTIuNS0yLjVzMS4xMi0yLjUgMi41LTIuNSAyLjUgMS4xMiAyLjUgMi41LTEuMTIgMi41LTIuNSAyLjV6Ii8+PC9zdmc+',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });

  private endIcon = L.icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjZWY0NDQ0IiBkPSJNMTIgMkM4LjEzIDIgNSA1LjEzIDUgOWMwIDUuMjUgNyAxMyA3IDEzczctNy43NSA3LTEzYzAtMy44Ny0zLjEzLTctNy03em0wIDkuNWMtMS4zOCAwLTIuNS0xLjEyLTIuNS0yLjVzMS4xMi0yLjUgMi41LTIuNSAyLjUgMS4xMiAyLjUgMi41LTEuMTIgMi41LTIuNSAyLjV6Ii8+PC9zdmc+',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });

  private waypointIcon = L.icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0Ij48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI0IiBmaWxsPSIjMzA3OGZmIi8+PC9zdmc+',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  });

  async ngOnInit() {
    // Get executive ID from route
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.executiveId.set(id);
      await this.loadTrail();
    }
  }

  ngAfterViewInit() {
    this.initializeMap();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private initializeMap() {
    this.map = L.map('trail-map', {
      center: [10.8505, 76.2711],
      zoom: 8,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    if (this.trail()) {
      this.drawTrailOnMap();
    }
  }

  async loadTrail() {
    this.isLoading.set(true);
    try {
      const hours = this.selectedTimeRange();
      const trail = await this.locationService.getExecutiveLocationTrail(
        this.executiveId(),
        undefined,
        hours
      );

      this.trail.set(trail);

      if (this.map) {
        this.drawTrailOnMap();
      }
    } catch (error) {
      console.error('Failed to load trail:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private drawTrailOnMap() {
    if (!this.map) return;

    const trail = this.trail();
    if (!trail || trail.locations.length === 0) return;

    // Clear existing markers and paths
    this.markers.forEach((marker) => marker.remove());
    this.markers = [];
    if (this.pathLine) {
      this.pathLine.remove();
    }

    const locations = trail.locations;

    // Create path line
    const latLngs: L.LatLngExpression[] = locations.map((loc) => [
      loc.latitude,
      loc.longitude,
    ]);

    this.pathLine = L.polyline(latLngs, {
      color: '#3b82f6',
      weight: 3,
      opacity: 0.7,
      smoothFactor: 1,
    }).addTo(this.map);

    // Add start marker (most recent)
    const startMarker = L.marker(
      [locations[0].latitude, locations[0].longitude],
      { icon: this.endIcon }
    );
    startMarker.bindPopup(this.createMarkerPopup(locations[0], 'Current Location'));
    startMarker.addTo(this.map);
    this.markers.push(startMarker);

    // Add end marker (oldest)
    if (locations.length > 1) {
      const lastIdx = locations.length - 1;
      const endMarker = L.marker(
        [locations[lastIdx].latitude, locations[lastIdx].longitude],
        { icon: this.startIcon }
      );
      endMarker.bindPopup(this.createMarkerPopup(locations[lastIdx], 'Start Location'));
      endMarker.addTo(this.map);
      this.markers.push(endMarker);
    }

    // Add waypoint markers (every 10th location or max 20 markers)
    const step = Math.max(1, Math.floor(locations.length / 20));
    for (let i = step; i < locations.length - 1; i += step) {
      const marker = L.marker(
        [locations[i].latitude, locations[i].longitude],
        { icon: this.waypointIcon }
      );
      marker.bindPopup(this.createMarkerPopup(locations[i], 'Waypoint'));
      marker.addTo(this.map);
      this.markers.push(marker);
    }

    // Fit map to show entire trail
    const bounds = this.pathLine.getBounds();
    this.map.fitBounds(bounds, { padding: [50, 50] });
  }

  private createMarkerPopup(point: TrailPoint, type: string): string {
    const battery = point.batteryLevel
      ? `<div class="popup-row">
           <i class="pi pi-bolt"></i>
           <span class="battery-${this.getBatteryClass(point.batteryLevel)}">
             ${point.batteryLevel}%
           </span>
         </div>`
      : '';

    return `
      <div class="trail-popup">
        <h6>${type}</h6>
        <div class="popup-row">
          <i class="pi pi-clock"></i>
          <span>${this.formatDateTime(point.timestamp)}</span>
        </div>
        <div class="popup-row">
          <i class="pi pi-map-marker"></i>
          <span>${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}</span>
        </div>
        ${battery}
      </div>
    `;
  }

  async onTimeRangeChange(hours: number) {
    this.selectedTimeRange.set(hours);
    await this.loadTrail();
  }

  // Timeline events for sidebar
  getTimelineEvents() {
    const trail = this.trail();
    if (!trail) return [];

    // Show max 50 events in timeline
    const locations = trail.locations.slice(0, 50);
    
    return locations.map((loc, index) => ({
      time: this.formatTime(loc.timestamp),
      date: this.formatDate(loc.timestamp),
      coords: `${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}`,
      battery: loc.batteryLevel,
      isMoving: loc.isMoving,
      isFirst: index === 0,
      isLast: index === locations.length - 1,
    }));
  }

  calculateStats() {
    const trail = this.trail();
    if (!trail || trail.locations.length === 0) {
      return {
        totalPoints: 0,
        distance: 0,
        duration: 0,
        avgSpeed: 0,
      };
    }

    const locations = trail.locations;
    let totalDistance = 0;

    // Calculate total distance
    for (let i = 0; i < locations.length - 1; i++) {
      const dist = this.calculateDistance(
        locations[i].latitude,
        locations[i].longitude,
        locations[i + 1].latitude,
        locations[i + 1].longitude
      );
      totalDistance += dist;
    }

    // Calculate duration
    const duration = locations[0].timestamp - locations[locations.length - 1].timestamp;
    const hours = duration / (1000 * 60 * 60);

    return {
      totalPoints: locations.length,
      distance: totalDistance,
      duration: hours,
      avgSpeed: hours > 0 ? totalDistance / hours : 0,
    };
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  formatDateTime(timestamp: number): string {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  getBatteryClass(level: number): string {
    if (level < 20) return 'danger';
    if (level < 50) return 'warning';
    return 'success';
  }
getBatteryColor(level?: number): 'success' | 'secondary' | 'info' | 'warn' | 'danger' {
  if (!level) return 'info';
  if (level < 20) return 'danger';
  if (level < 50) return 'warn'; // ✅ Changed from 'warning' to 'warn'
  return 'success';
}

}