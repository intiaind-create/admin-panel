import { Routes } from '@angular/router';

export const LOCATION_TRACKING_ROUTES: Routes = [
  {
    path: 'live-map',
    loadComponent: () =>
      import('./components/live-map/live-map.component').then(
        (m) => m.LiveMapComponent
      ),
    data: { fullWidth: true } 
  },
  {
    path: 'list',
    loadComponent: () =>
      import('./location-list/location-list.component').then(
        (m) => m.LocationListComponent
      ),
    data: { fullWidth: true } 
  },
  {
    path: 'executive/:id/trail',
    loadComponent: () =>
      import('./executive-trail/executive-trail.component').then(
        (m) => m.ExecutiveTrailComponent
      ),
    data: { fullWidth: true } 
  },
  { path: '', redirectTo: 'live-map', pathMatch: 'full' },
];