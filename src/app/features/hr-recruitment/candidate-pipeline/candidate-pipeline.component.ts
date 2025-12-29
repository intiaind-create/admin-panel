import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    CdkDragDrop,
    DragDropModule,
    transferArrayItem
} from '@angular/cdk/drag-drop';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext'; // ✅ ADD THIS
import { PipelineService } from './services/pipeline.service';
import {
    CandidateCard,
    PipelineStage,
    ApplicationStatus,
    JobOption
} from './types/pipeline.types';
import { Subscription } from 'rxjs';
import { PipelineStageComponent } from './candidate-pipeline-components/pipeline-stage/pipeline-stage.component';
import { Drawer, DrawerModule } from 'primeng/drawer';
import { Id } from 'convex/_generated/dataModel';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CandidateDetailComponent } from './candidate-pipeline-components/candidate-detail/candidate-detail.component';
import { ConvexService } from '@/core/services/convex.service';
import { api } from 'convex/_generated/api';
import { AuthService } from '@/core/services/auth.service';

@Component({
    selector: 'app-candidate-pipeline',
    standalone: true,
    imports: [
        CommonModule,
        DragDropModule,
        ButtonModule,
        SelectModule,
        FormsModule,
        InputTextModule, // ✅ ADD THIS
        PipelineStageComponent,
        CandidateDetailComponent,
        DrawerModule,
        ToastModule
    ],
    providers: [MessageService],
    templateUrl: './candidate-pipeline.component.html',
    styleUrls: ['candidate-pipeline.component.scss']
})
export class CandidatePipelineComponent implements OnInit, OnDestroy {
    pipelineService = inject(PipelineService);
    messageService = inject(MessageService);

    // State
    stages = this.pipelineService.stages;
    loading = this.pipelineService.loading;
    selectedJob = signal<Id<'job_postings'> | null>(null);

    // ✅ NEW: Job filtering
    availableJobs = signal<JobOption[]>([]);

    // ✅ NEW: Location filters state
    zones = signal<any[]>([]);
    districts = signal<any[]>([]);
    subdistricts = signal<any[]>([]);
    localBodyTypes = signal<any[]>([]);
    localBodies = signal<any[]>([]);
    wards = signal<any[]>([]);

    selectedZone = signal<string | null>(null);
    selectedDistrict = signal<string | null>(null);
    selectedSubdistrict = signal<string | null>(null);
    selectedLocalBodyType = signal<string | null>(null);
    selectedLocalBody = signal<string | null>(null);
    selectedWard = signal<string | null>(null);
    searchingWards = signal(false);
    // ✅ NEW: Ward search
    wardSearchQuery = signal<string>('');
    wardSearchResults = signal<any[]>([]);
     private convex = inject(ConvexService);
       private authService = inject(AuthService);
    // Drawer
    drawerVisible = signal(false);
    selectedCard = signal<CandidateCard | null>(null);
    selectedStageId = signal<ApplicationStatus | null>(null);
    syncing = signal(false);

    private cardSelectSub?: Subscription;

    allStageIds: ApplicationStatus[] = [
        'applied',
        'shortlisted',
        'interviewed',
        'selected',
        'rejected'
    ];

    async ngOnInit() {
        await this.loadJobs();
        await this.loadZones();
        this.setupCardSelectionListener();
    }

    ngOnDestroy() {
        this.cardSelectSub?.unsubscribe();
    }



    async loadJobs() {
        try {
            const jobs = await this.pipelineService.getAvailableJobs();
            this.availableJobs.set(jobs);

            // Auto-select first job if available
            if (jobs.length > 0) {
                this.selectedJob.set(jobs[0].value);
                await this.onJobSelect(jobs[0].value);
            }
        } catch (error) {
            console.error('Failed to load jobs:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to load jobs'
            });
        }
    }

    // ✅ NEW: Load zones
    async loadZones() {
        try {
            const zones = await this.pipelineService.getZones();
            this.zones.set(zones);

            const localBodyTypes =
                await this.pipelineService.getLocalBodyTypes();
            this.localBodyTypes.set(localBodyTypes);
        } catch (error) {
            console.error('Failed to load zones:', error);
        }
    }

    // ✅ NEW: Cascading zone → district
    async onZoneChange(zone: string | null) {
        this.selectedZone.set(zone);
        this.selectedDistrict.set(null);
        this.selectedSubdistrict.set(null);
        this.selectedLocalBody.set(null);
        this.selectedWard.set(null);
        this.districts.set([]);
        this.subdistricts.set([]);
        this.localBodies.set([]);
        this.wards.set([]);

        if (zone) {
            try {
                const districts = await this.pipelineService.getDistricts(zone);
                this.districts.set(districts);
            } catch (error) {
                console.error('Failed to load districts:', error);
            }
        }

        await this.applyFilters();
    }

    // ✅ NEW: Cascading district → subdistrict
    async onDistrictChange(district: string | null) {
        this.selectedDistrict.set(district);
        this.selectedSubdistrict.set(null);
        this.selectedLocalBody.set(null);
        this.selectedWard.set(null);
        this.subdistricts.set([]);
        this.localBodies.set([]);
        this.wards.set([]);

        if (district) {
            try {
                const subdistricts = await this.pipelineService.getSubdistricts(
                    this.selectedZone() || undefined,
                    district
                );
                this.subdistricts.set(subdistricts);
            } catch (error) {
                console.error('Failed to load subdistricts:', error);
            }
        }

        await this.applyFilters();
    }

    // ✅ NEW: Cascading subdistrict → local body
    async onSubdistrictChange(subdistrict: string | null) {
        this.selectedSubdistrict.set(subdistrict);
        this.selectedLocalBody.set(null);
        this.selectedWard.set(null);
        this.localBodies.set([]);
        this.wards.set([]);

        if (subdistrict) {
            try {
                const localBodies = await this.pipelineService.getLocalBodies(
                    this.selectedZone() || undefined,
                    this.selectedDistrict() || undefined,
                    subdistrict
                );
                this.localBodies.set(localBodies);
            } catch (error) {
                console.error('Failed to load local bodies:', error);
            }
        }

        await this.applyFilters();
    }

    // ✅ NEW: Local body → wards
    async onLocalBodyChange(localBody: string | null) {
        this.selectedLocalBody.set(localBody);
        this.selectedWard.set(null);
        this.wards.set([]);

        if (localBody) {
            try {
                const wards = await this.pipelineService.getWards(
                    this.selectedZone() || undefined,
                    this.selectedDistrict() || undefined,
                    this.selectedSubdistrict() || undefined,
                    localBody
                );
                this.wards.set(wards);
            } catch (error) {
                console.error('Failed to load wards:', error);
            }
        }

        await this.applyFilters();
    }

    // ✅ NEW: Ward search (debounced)
    async onWardSearch(query: string) {
        this.wardSearchQuery.set(query);

        if (query.length < 2) {
            this.wardSearchResults.set([]);
            return;
        }

        try {
            this.searchingWards.set(true);
            const results = await this.pipelineService.searchWards(query);
            this.wardSearchResults.set(results);
        } catch (error) {
            console.error('Ward search failed:', error);
        } finally {
            this.searchingWards.set(false); // ✅ Clear loading state
        }
    }

    // ✅ NEW: Apply all filters and reload pipeline
    async applyFilters() {
        const jobId = this.selectedJob();
        if (!jobId) return;

        // For now, just reload the pipeline
        // TODO: Implement filtered pipeline query
        await this.pipelineService.loadPipeline(jobId);
    }

    // ✅ NEW: Clear all filters
    async clearFilters() {
        this.selectedZone.set(null);
        this.selectedDistrict.set(null);
        this.selectedSubdistrict.set(null);
        this.selectedLocalBodyType.set(null);
        this.selectedLocalBody.set(null);
        this.selectedWard.set(null);
        this.wardSearchQuery.set('');
        this.wardSearchResults.set([]);

        this.districts.set([]);
        this.subdistricts.set([]);
        this.localBodies.set([]);
        this.wards.set([]);

        await this.applyFilters();
    }

    async onJobSelect(jobId: Id<'job_postings'>) {
        this.selectedJob.set(jobId);
        try {
            await this.pipelineService.loadPipeline(jobId);
        } catch (error) {
            console.error('Failed to load pipeline:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to load pipeline data'
            });
        }
    }

    setupCardSelectionListener() {
        this.cardSelectSub = this.pipelineService.selectedCard$.subscribe(
            ({ card, stageId }) => {
                this.selectedCard.set(card);
                this.selectedStageId.set(stageId);
                this.drawerVisible.set(true);
            }
        );
    }

    async onDrop(
        event: CdkDragDrop<CandidateCard[]>,
        newStageId: ApplicationStatus
    ) {
        if (event.previousContainer === event.container) {
            return;
        }

        const card = event.previousContainer.data[event.previousIndex];
        const previousStageId = this.getStageIdFromContainer(
            event.previousContainer.id
        );

        try {
            // Optimistic UI update
            transferArrayItem(
                event.previousContainer.data,
                event.container.data,
                event.previousIndex,
                event.currentIndex
            );

            // Backend update
            await this.pipelineService.moveCandidate(card.id, newStageId);

            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: `Moved ${card.candidateName} to ${newStageId}`
            });
        } catch (error: any) {
            console.error('Move failed:', error);

            // Rollback optimistic update
            transferArrayItem(
                event.container.data,
                event.previousContainer.data,
                event.currentIndex,
                event.previousIndex
            );

            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: error.message || 'Failed to move candidate'
            });
        }
    }

    private getStageIdFromContainer(containerId: string): ApplicationStatus {
        return containerId.replace('stage-', '') as ApplicationStatus;
    }

    onCardSelect(card: CandidateCard, stageId: ApplicationStatus) {
        console.log('🖱️ [Pipeline] Card selected:', card.candidateName);
        this.selectedCard.set(card);
        this.selectedStageId.set(stageId);
        this.drawerVisible.set(true);
    }

    closeDrawer() {
        this.drawerVisible.set(false);
        this.selectedCard.set(null);
        this.selectedStageId.set(null);
    }

    async onCandidateUpdate() {
        this.closeDrawer();
        const jobId = this.selectedJob();
        if (jobId) {
            await this.pipelineService.loadPipeline(jobId);
        }
    }

    async onLoadMoreStage(stageId: ApplicationStatus) {
        const jobId = this.selectedJob();
        if (!jobId) return;
        await this.pipelineService.loadMoreForStage(
            jobId as Id<'job_postings'>,
            stageId
        );
    }
}
