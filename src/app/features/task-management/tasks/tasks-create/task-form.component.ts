// src/app/features/task-management/tasks/tasks-create/task-form.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { EditorModule } from 'primeng/editor';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FileUploadModule } from 'primeng/fileupload';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { InputNumberModule } from 'primeng/inputnumber';

// ✅ Import from real services and models
import { TaskService } from '../../services/task.service';
import { UserService } from '@/features/user-management/user.service';
import {
    CreateTaskData,
    TaskPriority,
    TaskType,
    EnrichedTask,
    Executive,
    Voter
} from '../../models';
import { Id } from 'convex/_generated/dataModel';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';

@Component({
    selector: 'app-task-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ButtonModule,
        InputTextModule,
        InputNumberModule,
        EditorModule,
        SelectModule,
        DatePickerModule,
        AutoCompleteModule,
        FileUploadModule,
        ToastModule,
        FormsModule,
        DialogModule,
        TableModule
    ],
    providers: [MessageService],
    templateUrl: './task-form.component.html',
    styleUrls: ['./task-form.component.scss']
})
export class TaskFormComponent implements OnInit {
    taskForm!: FormGroup;
    isEditMode = false;
    currentTaskId: Id<'tasks'> | null = null;
    isLoading = true;
    minDate = new Date();
    showVotersModal = false;
    selectedVoters: any[] = [];
    votersToAssign: any[] = [];
    allExecutives: Executive[] = [];
    filteredExecutives: Executive[] = [];
    selectedExecutive: Executive | null = null; // ✅ TRACK SELECTED
    selectedExecutiveName: string = ''; // For display in autocomplete
    taskPriorities: { label: string; value: TaskPriority }[] = [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
        { label: 'Urgent', value: 'urgent' }
    ];

    taskTypes: { label: string; value: TaskType }[] = [
        { label: 'Verification', value: 'verification' },
        { label: 'Survey', value: 'survey' },
        { label: 'Collection', value: 'collection' },
        { label: 'Other', value: 'other' }
    ];

    fb = inject(FormBuilder);
    router = inject(Router);
    route = inject(ActivatedRoute);
    taskService = inject(TaskService);
    userService = inject(UserService);
    messageService = inject(MessageService);

    constructor() {
        this.taskForm = this.fb.group({
            title: ['', [Validators.required, Validators.minLength(3)]],
            description: ['', Validators.required],
            type: ['verification' as TaskType, Validators.required],
            priority: ['medium' as TaskPriority, Validators.required],
            assignedTo: [null, Validators.required],
            dueDate: [null, Validators.required],
            estimatedHours: [1, [Validators.required, Validators.min(0.5)]],
            wardId: ['', Validators.required], // ✅ WARD ID FIELD (auto-filled)
            wardDisplay: [''],
            notes: [''],
            votersList: [[]]
        });
    }

    async ngOnInit() {
        await this.loadExecutives();

        const taskId = this.route.snapshot.paramMap.get('id');
        if (taskId) {
            this.currentTaskId = taskId as Id<'tasks'>;
            this.isEditMode = true;
            await this.loadTask(this.currentTaskId);
        }
        this.isLoading = false;
    }

    async loadExecutives() {
        try {
            const result = await this.userService.getExecutives(
                { numItems: 100, cursor: null },
                { isActive: true }
            );

            // ✅ MAP TO INCLUDE WARD ID
            this.allExecutives = result.page.map((exec: any) => ({
                _id: exec._id,
                name: exec.name,
                email: exec.email,
                employeeId: exec.employeeId,
                wardId: exec.wardId, // ✅ EXTRACT WARD ID
                wardName: exec.wardName,
                zone: exec.zone,
                district: exec.district,
                hierarchyId: exec.hierarchyId
            }));

            console.log('✅ Loaded executives:', this.allExecutives.length);
        } catch (error) {
            console.error('Failed to load executives:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to load executives',
                life: 3000
            });
        }
    }

    async loadTask(taskId: Id<'tasks'>) {
        try {
            const task = await this.taskService.getTask(taskId);
            console.log('✅ Loaded task for editing:', task);
            // ✅ Find and set the selected executive
            this.selectedExecutiveName = task.executiveName || '';
            this.selectedExecutive =
                this.allExecutives.find((e) => e._id === task.assignedTo) ||
                null;
            if (this.selectedExecutive) {
                this.selectedExecutiveName = this.selectedExecutive.name;
            }

            this.taskForm.patchValue({
                title: task.title,
                description: task.description,
                type: (task as any).type || 'other',
                priority: task.priority,
                assignedTo: task.assignedTo,
                dueDate: new Date(task.dueDate),
                estimatedHours: (task as any).estimatedHours || 1,
                wardId: (task as any).wardId || '',
                notes: (task as any).notes || ''
            });

            console.log('✅ Task loaded for editing');
        } catch (error) {
            console.error('Failed to load task:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to load task',
                life: 3000
            });
        }
    }
    filterExecutives(event: any) {
        const query = event.query.toLowerCase();

        // Filter and return just the names as suggestions
        const filtered = this.allExecutives.filter(
            (exec) =>
                exec.name.toLowerCase().includes(query) ||
                exec.employeeId.toLowerCase().includes(query) ||
                exec.email.toLowerCase().includes(query)
        );

        this.filteredExecutives = filtered;
    }

    // ✅ WHEN EXECUTIVE SELECTED → AUTO-FILL WARD ID
    onExecutiveSelect(event: any) {
        console.log('✅ Executive selected (raw event):', event);

        // For PrimeNG p-autoComplete the selected value is usually in event.value
        const executive = event?.value ?? event;
        console.log('🔍 Matched executive object:', executive);

        if (executive) {
            this.selectedExecutiveName = executive.name;
            this.selectedExecutive = executive; // ✅ actually store the object
            console.log('✅ Full executive object:', this.selectedExecutive);

            this.taskForm.patchValue({
                assignedTo: executive._id,
                wardId: executive.wardId
            });

            console.log('✅ Assigned To ID:', executive._id);
            console.log('✅ Ward ID set:', executive.wardId);
            console.log('✅ Ward Name (if present):', executive.wardName);
        }
    }

    // ✅ DISPLAY EXECUTIVE NAME (not [object])
    getExecutiveName(executiveId: Id<'executives'>): string {
        const exec = this.allExecutives.find((e) => e._id === executiveId);
        return exec ? exec.name : '';
    }

    onCancel() {
        this.router.navigate(['/tasks']);
    }
async onSubmit() {
  if (this.taskForm.invalid) {
    this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: 'Please fill all required fields' });
    return;
  }

  const formValue = this.taskForm.value;
  
  try {
    if (this.isEditMode && this.currentTaskId) {
      // UPDATE includes votersList
      await this.taskService.updateTask(this.currentTaskId, {
        title: formValue.title,
        description: formValue.description,
        priority: formValue.priority,
         dueDate: formValue.dueDate.getTime(),
        estimatedHours: formValue.estimatedHours,
        assignedTo: formValue.assignedTo,
        wardId: formValue.wardId,
        notes: formValue.notes,
        votersList: formValue.votersList || []  // 🔥 NEW
      });
    } else {
      // CREATE includes votersList
      const taskData: CreateTaskData = {
        title: formValue.title,
        description: formValue.description,
        type: formValue.type,
        priority: formValue.priority,
        assignedTo: formValue.assignedTo,
        dueDate: formValue.dueDate.getTime(),
        estimatedHours: formValue.estimatedHours,
        wardId: formValue.wardId,
        notes: formValue.notes,
        votersList: formValue.votersList || []  // 🔥 NEW
      };
      await this.taskService.createTask(taskData);
    }
    
    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Task saved successfully' });
    setTimeout(() => this.router.navigate(['/tasks/tasks-list']), 1000);
  } catch (error: any) {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: error?.message || 'Failed to save task' });
  }
}

// ✅ CORRECTED - Use UploadEvent
async uploadVoters(event: any) {
  const file = event.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const rows: string[] = text.split('\n').slice(1);
    
    this.selectedVoters = rows
      .map((row: string, index: number): Voter => {
        const cols = row.split(',');
        return {
          _id: `voter-${Date.now()}-${index}`,
          name: cols[0]?.trim() || '',
          fatherHusbandName: cols[1]?.trim() || '',
          age: parseInt(cols[2] || '0'),
          address: cols[3]?.trim() || '',
          sex: cols[4]?.trim() || '',
          selected: true
        };
      })
      .filter((voter: Voter) => voter.name.length > 0);

    this.messageService.add({
      severity: 'success',
      summary: 'Voters Loaded',
      detail: `${this.selectedVoters.length} voters loaded`
    });
  } catch (error) {
    this.messageService.add({
      severity: 'error',
      summary: 'Upload Failed',
      detail: 'Invalid CSV format'
    });
  }
}

assignVotersToTask() {
  this.votersToAssign = this.selectedVoters.filter(v => v.selected);
  this.taskForm.patchValue({
    votersList: this.votersToAssign.map(v => v._id)
  });
  this.showVotersModal = false;
  
  this.messageService.add({
    severity: 'success',
    summary: 'Voters Assigned',
    detail: `${this.votersToAssign.length} voters assigned to task`
  });
}

}
