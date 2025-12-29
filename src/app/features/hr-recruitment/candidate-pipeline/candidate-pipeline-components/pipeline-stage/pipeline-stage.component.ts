import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { ButtonModule } from 'primeng/button';
import { PipelineStage, ApplicationStatus, CandidateCard } from '../../types/pipeline.types';
import { CandidateCardComponent } from '../candidate-card/candidate-card.component';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pipeline-stage',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    ButtonModule,
    TagModule,
    CandidateCardComponent,
    CardModule,
    FormsModule
  ],
  templateUrl: './pipeline-stage.component.html',
styleUrls: ['./pipeline-stage.component.scss']
})
export class PipelineStageComponent {
  @Input() stage!: PipelineStage;
  @Input() allStageIds!: ApplicationStatus[];

  @Output() cardDropped = new EventEmitter<CdkDragDrop<any>>();
  @Output() cardSelected = new EventEmitter<{ card: CandidateCard; stageId: ApplicationStatus }>();
@Output() loadMore = new EventEmitter<ApplicationStatus>();
searchTerm = '';
isLoadingMore = signal(false);
  onDrop(event: CdkDragDrop<any>) {
    this.cardDropped.emit(event);
  }
get filteredCandidates(): CandidateCard[] {
  const term = this.searchTerm.trim().toLowerCase();
  if (!term) return this.stage.candidates;
  return this.stage.candidates.filter(c =>
    c.candidateName.toLowerCase().includes(term) ||
    c.email.toLowerCase().includes(term) ||
    c.phone?.includes(term)
  );
}
onSearchChange(value: string) {
  this.searchTerm = value;
}
  onCardClicked(card: CandidateCard) {
    console.log('🖱️ Stage clicked card:', card.candidateName);
    this.cardSelected.emit({ card, stageId: this.stage.stageId });
  }

  getStageColor(stageId: ApplicationStatus): 'success' | 'secondary' | 'info' | 'warn' | 'danger' {
    const colorMap: Record<ApplicationStatus, 'success' | 'secondary' | 'info' | 'warn' | 'danger'> = {
      applied: 'info',
      shortlisted: 'secondary',
      interviewed: 'warn',
      selected: 'success',
      rejected: 'danger'
    };
    return colorMap[stageId];
  }

    async onLoadMoreClick() {
    if (this.stage.isDone || !this.stage.nextCursor) return;
    this.isLoadingMore.set(true);
    this.loadMore.emit(this.stage.stageId);
    this.isLoadingMore.set(false);
  }

   onLoadMore() {
    if (this.stage.isDone || !this.stage.nextCursor) return;
    this.loadMore.emit(this.stage.stageId);
  }
}
