import { Routes } from '@angular/router';
import { ViewProgressComponent } from './view-progress/view-progress.component';
import { ManageContentComponent } from './manage-content/manage-content.component';
import { QuizManagerComponent } from './quiz-manager/quiz-manager.component';

export const TRAINING_ROUTES: Routes = [
    {
        path: 'progress',
        component: ViewProgressComponent,
        title: 'View Progress'
    },
    {
        path: 'content',
        component: ManageContentComponent,
        title: 'Manage Content'
    },
      {
    path: 'quiz', // ✅ NEW ROUTE
    component: QuizManagerComponent,
    title: 'Quiz Manager'
  }
];
