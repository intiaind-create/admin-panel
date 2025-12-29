import { Routes } from "@angular/router";

export const SETTINGS_ROUTES: Routes = [
    {
        path: 'certificate-templates',
        loadComponent: () => import('./certificate-template/certificate-template.component').then(m => m.CertificateTemplateComponent),
        title: 'Certificate Templates'
    },
    {
        path:'tasks-settings',
        loadComponent: () => import('./tasks-settings/tasks-settings-component').then(m => m.TasksSettingsComponent),
        title: 'Tasks Settings'
    }
]