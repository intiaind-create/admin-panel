import { Routes } from '@angular/router';
import { CandidatePipelineComponent } from './candidate-pipeline/candidate-pipeline.component';
import { ManageJobsComponent } from './manage-jobs/jobs-list/manage-jobs.component';
import { JobFormComponent } from './manage-jobs/jobs-form/job-form.component';

// Define all routes for the HR & Recruitment feature here
export const RECRUITMENT_ROUTES: Routes = [
    {
        path: 'pipeline',
        component: CandidatePipelineComponent,
        title: 'Candidate Pipeline'
    },
    {
        path: 'jobs', // The list of jobs
        component: ManageJobsComponent,
        title: 'Manage Jobs'
    },
    {
        path: 'jobs/new', // The "Create New" form
        component: JobFormComponent,
        title: 'New Job Posting'
    },
    {
        path: 'jobs/edit/:id', // The "Edit" form
        component: JobFormComponent,
        title: 'Edit Job Posting'
    },
];