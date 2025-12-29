// src/app/features/settings/services/task-category.service.ts

import { Injectable } from '@angular/core';

export interface TaskCategory {
  id?: string;
  name: string;
  description?: string;
  color: string;
}

@Injectable({
  providedIn: 'root'
})
export class TaskCategoryService {
  private _categories: TaskCategory[] = [
    { id: 'cat-1', name: 'Site Visit', description: 'Tasks related to on-site executive visits.', color: '#42A5F5' },
    { id: 'cat-2', name: 'Client Meeting', description: 'All tasks involving client-facing meetings.', color: '#66BB6A' },
    { id: 'cat-3', name: 'Report Submission', description: 'Includes daily, weekly, and monthly reports.', color: '#FFA726' },
    { id: 'cat-4', name: 'Internal Training', description: 'Tasks for completing training modules.', color: '#AB47BC' }
  ];

  getCategories(): Promise<TaskCategory[]> {
    return Promise.resolve(this._categories);
  }

  addCategory(category: TaskCategory): Promise<TaskCategory> {
    category.id = 'cat-' + Math.random().toString(36).substring(2, 9);
    this._categories.push(category);
    return Promise.resolve(category);
  }

  updateCategory(updatedCategory: TaskCategory): Promise<TaskCategory> {
    const index = this._categories.findIndex(c => c.id === updatedCategory.id);
    if (index > -1) {
      this._categories[index] = updatedCategory;
    }
    return Promise.resolve(updatedCategory);
  }

  deleteCategory(id: string): Promise<void> {
    this._categories = this._categories.filter(c => c.id !== id);
    return Promise.resolve();
  }
}
