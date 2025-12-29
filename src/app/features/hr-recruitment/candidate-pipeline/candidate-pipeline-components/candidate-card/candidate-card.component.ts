import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CandidateCard, ApplicationStatus } from '../../types/pipeline.types';
import { PipelineService } from '../../services/pipeline.service';

@Component({
  selector: 'app-candidate-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './candidate-card.component.html',
  styleUrls: ['./candidate-card.component.scss'],
})
export class CandidateCardComponent {
  @Input() card!: CandidateCard;
  @Input() stageId!: ApplicationStatus;

  constructor(private pipelineService: PipelineService) {}

  onCardClick() {
    this.pipelineService.onCardSelect(this.card, this.stageId);
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
