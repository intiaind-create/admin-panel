// src/app/features/settings/tasks-settings/tasks-settings-component.ts

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ColorPickerModule } from 'primeng/colorpicker';
import { TagModule } from 'primeng/tag';

// ✅ FIXED: Import from the new task-category.service
import { TaskCategoryService, TaskCategory } from '../services/task-category.service';

@Component({
    selector: 'app-task-categories',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        ToolbarModule,
        DialogModule,
        ToastModule,
        ConfirmDialogModule,
        InputTextModule,
        TextareaModule,
        ColorPickerModule,
        TagModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './task-settings.component.html'
})
export class TasksSettingsComponent implements OnInit {
    categoryDialog = false;
    categories = signal<TaskCategory[]>([]);
    category: TaskCategory = { name: '', color: '#ffffff' };
    submitted = false;

    constructor(
        private taskCategoryService: TaskCategoryService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.taskCategoryService
            .getCategories()
            .then((data) => this.categories.set(data));
    }

    openNew() {
        this.category = { name: '', color: '#6366F1' };
        this.submitted = false;
        this.categoryDialog = true;
    }

    editCategory(category: TaskCategory) {
        this.category = { ...category };
        this.categoryDialog = true;
    }

    deleteCategory(category: TaskCategory) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete "' + category.name + '"?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.taskCategoryService
                    .deleteCategory(category.id!)
                    .then(() => {
                        this.categories.update((cats) =>
                            cats.filter((c) => c.id !== category.id)
                        );
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Successful',
                            detail: 'Category Deleted',
                            life: 3000
                        });
                    });
            }
        });
    }

    hideDialog() {
        this.categoryDialog = false;
        this.submitted = false;
    }

    saveCategory() {
        this.submitted = true;

        if (!this.category.name?.trim()) {
            return;
        }

        if (this.category.id) {
            // Update existing category
            this.taskCategoryService
                .updateCategory(this.category)
                .then((updatedCategory) => {
                    this.categories.update((cats) =>
                        cats.map((c) =>
                            c.id === updatedCategory.id ? updatedCategory : c
                        )
                    );
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Successful',
                        detail: 'Category Updated',
                        life: 3000
                    });
                });
        } else {
            // Create new category
            this.taskCategoryService
                .addCategory(this.category)
                .then((newCategory) => {
                    this.categories.update((cats) => [...cats, newCategory]);
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Successful',
                        detail: 'Category Created',
                        life: 3000
                    });
                });
        }

        this.categoryDialog = false;
    }
}
