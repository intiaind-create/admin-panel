import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { CandidateCard, ApplicationStatus } from '../../types/pipeline.types';
import { PipelineService } from '../../services/pipeline.service';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-candidate-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DrawerModule,
        ButtonModule,
        InputTextModule,
        TextareaModule,
        AvatarModule,
        TagModule,
        DividerModule
    ],
    templateUrl: './candidate-detail.component.html',
    styleUrls: ['./candidate-detail.component.scss']
})
export class CandidateDetailComponent {
    @Input() candidate: CandidateCard | null = null;
    @Input() currentStage: ApplicationStatus | null = null;
    @Input() visible = false;

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() candidateUpdated = new EventEmitter<void>();
    @Output() closeDrawer = new EventEmitter<void>();

    rejectionReason = '';

    constructor(
        private pipelineService: PipelineService,
        private messageService: MessageService
    ) {}

    get candidateData() {
        return this.candidate;
    }

    get stageId() {
        return this.currentStage;
    }

    onHide() {
        this.visible = false;
        this.visibleChange.emit(false);
        this.closeDrawer.emit();
    }

    async changeStatus(targetStatus: ApplicationStatus) {
        const candidate = this.candidateData;
        if (!candidate) return;

        try {
            await this.pipelineService.moveCandidate(
                candidate.id,
                targetStatus
            );

            this.messageService.add({
                severity: 'success',
                summary: 'Status Updated',
                detail: `${candidate.candidateName} moved to ${targetStatus}`
            });

            this.currentStage = targetStatus;
            this.candidateUpdated.emit();
        } catch (error: any) {
            this.messageService.add({
                severity: 'error',
                summary: 'Update Failed',
                detail: error.message || 'Failed to change status'
            });
        }
    }

    async rejectCandidate() {
        const candidate = this.candidateData;
        if (!candidate || !this.rejectionReason.trim()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Please provide a rejection reason'
            });
            return;
        }

        try {
            await this.pipelineService.moveCandidate(
                candidate.id,
                'rejected',
                this.rejectionReason
            );

            this.messageService.add({
                severity: 'success',
                summary: 'Candidate Rejected',
                detail: `${candidate.candidateName} has been rejected`
            });

            this.currentStage = 'rejected';
            this.candidateUpdated.emit();
        } catch (error: any) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: error.message || 'Failed to reject candidate'
            });
        }
    }

    viewResume() {
        const candidate = this.candidateData;
        if (!candidate || !candidate.resumeUrl) {
            this.messageService.add({
                severity: 'info',
                summary: 'Resume Not Found',
                detail: 'No resume URL is available for this candidate yet.'
            });
            return;
        }

        window.open(candidate.resumeUrl, '_blank');
    }

    async createUserAccount() {
        const candidate = this.candidateData;
        if (!candidate) {
            this.messageService.add({
                severity: 'warn',
                summary: 'No Candidate',
                detail: 'No candidate selected'
            });
            return;
        }

        if (this.stageId !== 'selected') {
            this.messageService.add({
                severity: 'warn',
                summary: 'Invalid Stage',
                detail: 'Only selected candidates can be converted to users'
            });
            return;
        }

        if (candidate.convertedToUserId) {
            this.messageService.add({
                severity: 'info',
                summary: 'Already Converted',
                detail: `${candidate.candidateName} has already been converted to a user account`
            });
            return;
        }

        try {
            console.log('🧪 TEST MODE: Calling convertApplicationToUser...');
            console.log('📋 Full Candidate Data:', candidate);
            console.log('📋 Available fields:', Object.keys(candidate));

            // ✅ Type-safe access to candidate properties
            const candidateAny = candidate as any;

            // ✅ CRITICAL FIX: Get jobTitle from multiple possible sources
            // Priority: jobTitle > jobLevel > position > role > fallback
            let jobTitle =
                candidate.jobTitle ||
                candidateAny.jobLevel ||
                candidateAny.position ||
                candidateAny.role ||
                candidateAny.positionTitle;

            console.log('🔍 Field Check:');
            console.log('   - candidate.jobTitle:', candidate.jobTitle);
            console.log('   - candidateAny.jobLevel:', candidateAny.jobLevel);
            console.log('   - candidateAny.position:', candidateAny.position);
            console.log('   - candidateAny.role:', candidateAny.role);
            console.log(
                '   - candidateAny.positionTitle:',
                candidateAny.positionTitle
            );

            // ✅ If still no jobTitle, try to get it from the job posting
            if (!jobTitle && candidateAny.jobPostingId) {
                console.log(
                    '⚠️ No jobTitle in candidate, checking job posting ID...'
                );
                console.log('📌 Job Posting ID:', candidateAny.jobPostingId);
                // TODO: Implement job posting fetch if needed
            }

            // Final fallback
            if (!jobTitle) {
                jobTitle = 'Executive';
                console.warn('⚠️ Using fallback jobTitle:', jobTitle);
                console.warn(
                    '⚠️ CandidateCard appears to be missing job title field!'
                );
                console.warn(
                    '   This should be fixed in the backend query that populates CandidateCard'
                );
            }

            console.log('✅ Final jobTitle to use:', jobTitle);

            const result = await this.pipelineService.convertApplicationToUser(
                candidate.id,
                jobTitle
            );

            console.log('✅ TEST RESULT:', result);

            // ✅ Show test results in toast
            this.messageService.add({
                severity: 'success',
                summary: '🧪 TEST MODE - UserType Detected',
                detail: `Job: "${jobTitle}" → UserType: "${result.userType}" ✓`,
                life: 8000
            });

            this.messageService.add({
                severity: 'info',
                summary: '📋 Mock Response',
                detail: `Setup link ready (mock mode). Check console for full details.`,
                life: 8000
            });

            // ✅ Show what would be sent to backend
            console.log('🔍 WOULD SEND TO BACKEND:');
            console.log('   - applicationId:', candidate.id);
            console.log('   - jobTitle:', jobTitle);
            console.log('   - userType:', result.userType);
            console.log('   - setupLink (mock):', result.setupLink);

            if (!candidate.jobTitle) {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Data Issue Detected',
                    detail: 'jobTitle missing from CandidateCard - check console for details',
                    life: 5000
                });
            }

            // Don't close drawer in test mode - let user review
            // this.onHide();
            // this.candidateUpdated.emit();
        } catch (error: any) {
            console.error('❌ TEST FAILED:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Test Failed',
                detail: error.message || 'UserType detection failed'
            });
        }
    }

    private showSetupLinkDialog(setupLink: string, userType: string) {
        const userLabel = userType === 'executive' ? 'Executive' : 'Admin';
        const message = `📧 ${userLabel} account created!\n\nCopy this link and send to ${this.candidateData?.candidateName}:\n\n${setupLink}\n\n⏰ Expires in 24 hours`;

        if (confirm(message)) {
            navigator.clipboard.writeText(setupLink).then(() => {
                this.messageService.add({
                    severity: 'info',
                    summary: 'Setup Link Ready',
                    detail: `Link sent to ${this.candidate?.candidateName}. Expires in 24h.`
                });
            });
        }
    }

    getInitials(name: string): string {
        return name
            .split(' ')
            .filter(Boolean)
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }
}
