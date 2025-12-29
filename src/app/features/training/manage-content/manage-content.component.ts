import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { TreeNode, MessageService, SharedModule } from 'primeng/api';
import { TreeModule } from 'primeng/tree';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SplitterModule } from 'primeng/splitter';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InputNumberModule } from 'primeng/inputnumber';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { EditorModule } from 'primeng/editor';
import { FileUploadModule } from 'primeng/fileupload';
import { MenuModule } from 'primeng/menu';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';

import { Id } from 'convex/_generated/dataModel';

import { TrainingService } from '../services/training.service';
import { ContentTreeNode, Course } from '../interfaces/training.interface';
import { SafeResourcePipe } from '../saferesourcespipe/safe-resource.pipe';

@Component({
    selector: 'app-manage-content',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TreeModule,
        SharedModule,
        ButtonModule,
        InputTextModule,
        EditorModule,
        SplitterModule,
        FileUploadModule,
        RadioButtonModule,
        DialogModule,
        MenuModule,
        ToolbarModule,
        SelectModule,
        ToastModule,
        TooltipModule,
        DividerModule,
        InputNumberModule,
        CheckboxModule,
        ProgressSpinnerModule,
        TagModule,
        CardModule,
        SafeResourcePipe
    ],
    templateUrl: './manage-content.component.html',
    styleUrls: ['./manage-content.component.scss'],
    providers: [MessageService]
})
export class ManageContentComponent implements OnInit {
    // Signals
    loading = signal(false);
    saving = signal(false);
    uploading = signal(false);

    // Tree data
    courseTree = signal<TreeNode[]>([]);
    selectedNode: TreeNode | null = null;

    // Content fields
    selectedContentTitle = '';
    selectedContentDescription = '';
    selectedContentCategory = '';
    selectedContentType:
        | 'course'
        | 'video'
        | 'document'
        | 'quiz'
        | 'interactive'
        | '' = '';

    // Module content file
    selectedModuleStorageId: Id<'_storage'> | null = null;
    selectedModuleContentUrl: string | null = null;

    // Dialogs
    showNewCourseDialog = false;
    showAddModuleDialog = false;

    // Add module model
    newModule = {
        title: '',
        description: '',
        estimatedMinutes: 60,
        contentType: 'video' as 'video' | 'document' | 'quiz' | 'interactive',
        isRequired: true
    };
newCourse = {
  title: '',
  description: '',
  category: '',
  difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
  estimatedHours: 0,
  passingScore: 70,
  modules: [] as any[]
};


    // Dropdown options
    contentTypes = [
        { label: 'Course', value: 'course' },
        { label: 'Video', value: 'video' },
        { label: 'Document', value: 'document' },
        { label: 'Quiz', value: 'quiz' },
        { label: 'Interactive', value: 'interactive' }
    ];

    categories = [
        { label: 'Leadership', value: 'leadership' },
        { label: 'Technical', value: 'technical' },
        { label: 'Compliance', value: 'compliance' },
        { label: 'Soft Skills', value: 'soft_skills' }
    ];
difficultyOptions = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' }
];
    constructor(
        private trainingService: TrainingService,
        private messageService: MessageService
    ) {}

    async ngOnInit() {
        await this.loadCourses();
    }
async createCourse() {
  if (!this.newCourse.title || !this.newCourse.category) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please fill in Title and Category'
    });
    return;
  }

  this.saving.set(true);
  try {
    const result = await this.trainingService.createCourse({
      title: this.newCourse.title,
      description: this.newCourse.description,
      category: this.newCourse.category,
      difficulty: this.newCourse.difficulty,
      estimatedHours: this.newCourse.estimatedHours,
      passingScore: this.newCourse.passingScore,
      modules: [] // Start with empty modules array
    });

    this.messageService.add({
      severity: 'success',
      summary: 'Course Created',
      detail: `${this.newCourse.title} has been created successfully`
    });

    this.showNewCourseDialog = false;
    this.resetNewCourse();
    await this.loadCourses();
  } catch (error: any) {
    console.error('❌ Create course failed:', error);
    this.messageService.add({
      severity: 'error',
      summary: 'Create Failed',
      detail: error.message || 'Failed to create course'
    });
  } finally {
    this.saving.set(false);
  }
}

private resetNewCourse() {
  this.newCourse = {
    title: '',
    description: '',
    category: '',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    estimatedHours: 0,
    passingScore: 70,
    modules: []
  };
}
    // ---------------------------------------------------------------------------
    // LOAD COURSES & BUILD TREE
    // ---------------------------------------------------------------------------
    async loadCourses() {
        this.loading.set(true);
        try {
            await this.buildCourseTree();
            this.messageService.add({
                severity: 'success',
                summary: 'Loaded',
                detail: 'Courses loaded successfully'
            });
        } catch (error: any) {
            console.error('❌ loadCourses failed', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: error.message || 'Failed to load courses'
            });
        } finally {
            this.loading.set(false);
        }
    }

    private async buildCourseTree() {
        const courses = (await this.trainingService.getCourses()) as Course[];

        const tree: ContentTreeNode[] = courses.map((course) => ({
            label: course.title,
            key: course._id as any,
            data: course,
            expanded: true,
            children: (course.modules || []).map(
                (module: any, index: number) => ({
                    label: module.title || `Module ${index + 1}`,
                    key: module._id as any,
                    data: {
                        ...module,
                        courseTitle: course.title,
                        isModule: true
                    },
                    leaf: true
                })
            )
        }));

        this.courseTree.set(tree as any as TreeNode[]);
        console.log('🌳 courseTree:', this.courseTree());
    }

    getTotalModules(): number {
        return this.courseTree().reduce((total, course) => {
            return total + (course.children?.length || 0);
        }, 0);
    }

    // ---------------------------------------------------------------------------
    // SELECTION
    // ---------------------------------------------------------------------------
    async onNodeSelect(event: any) {
        console.log('📌 Node selected:', event.node);
        this.selectedNode = event.node;

        const data = event.node?.data || {};

        this.selectedContentTitle = data.title || '';
        this.selectedContentDescription = data.description || '';
        this.selectedContentCategory = data.category || '';
        this.selectedContentType =
            data.contentType || (event.node.parent ? 'video' : 'course');

        this.selectedModuleStorageId = null;
        this.selectedModuleContentUrl = null;

        if (data.contentId) {
            this.selectedModuleStorageId = data.contentId as Id<'_storage'>;
            await this.loadSelectedModuleContentUrl();
        }
    }

    isCourse(): boolean {
        return !!this.selectedNode && !this.selectedNode.parent;
    }

    isModule(): boolean {
        return !!this.selectedNode && !!this.selectedNode.parent;
    }

    // ---------------------------------------------------------------------------
    // MODULE CONTENT FILE
    // ---------------------------------------------------------------------------
    private async loadSelectedModuleContentUrl() {
        if (!this.selectedModuleStorageId) return;

        this.uploading.set(true);
        try {
            const url = await this.trainingService.getModuleContentUrl(
                this.selectedModuleStorageId
            );
            this.selectedModuleContentUrl = url;
        } catch (error) {
            console.error('❌ Failed to load content URL', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Content error',
                detail: 'Could not load module content'
            });
        } finally {
            this.uploading.set(false);
        }
    }

    async onModuleFileSelected(event: any) {
        if (!this.selectedNode || !this.isModule()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Select module',
                detail: 'Please select a module first.'
            });
            return;
        }

        const file: File | undefined =
            event?.files?.[0] || event?.target?.files?.[0];
        if (!file) return;

        const contentType = (this.selectedContentType ||
            this.selectedNode.data?.contentType) as
            | 'video'
            | 'document'
            | 'quiz'
            | 'interactive';

        if (contentType !== 'video' && contentType !== 'document') {
            this.messageService.add({
                severity: 'warn',
                summary: 'Unsupported type',
                detail: 'Only video or document modules can have files.'
            });
            return;
        }

        const validationError = this.trainingService.validateModuleFile(
            file,
            contentType
        );
        if (validationError) {
            this.messageService.add({
                severity: 'error',
                summary: 'Invalid file',
                detail: validationError
            });
            return;
        }

        this.uploading.set(true);

        try {
            const storageId = await this.trainingService.uploadModuleFile(file);
            const moduleId = this.selectedNode.data
                ._id as Id<'training_modules'>;

            await this.trainingService.updateModuleContent(moduleId, storageId);

            this.selectedModuleStorageId = storageId;
            const url =
                await this.trainingService.getModuleContentUrl(storageId);
            this.selectedModuleContentUrl = url;

            this.messageService.add({
                severity: 'success',
                summary: 'Content uploaded',
                detail: 'Module content linked successfully.'
            });
        } catch (error: any) {
            console.error('❌ Upload/link failed', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Upload failed',
                detail: error.message || 'Could not upload module content'
            });
        } finally {
            this.uploading.set(false);
        }
    }

    // ---------------------------------------------------------------------------
    // ADD MODULE
    // ---------------------------------------------------------------------------
    openAddModuleDialog() {
        if (!this.selectedNode || !this.isCourse()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Select course',
                detail: 'Select a course before adding a module.'
            });
            return;
        }
        this.newModule = {
            title: '',
            description: '',
            estimatedMinutes: 60,
            contentType: 'video',
            isRequired: true
        };
        this.showAddModuleDialog = true;
    }

    async createModuleFromDialog() {
        if (!this.selectedNode || !this.isCourse()) return;

        const courseId = this.selectedNode.data._id as Id<'training_courses'>;

        this.saving.set(true);
        try {
            await this.trainingService.addModule(courseId, this.newModule);
            this.messageService.add({
                severity: 'success',
                summary: 'Module created',
                detail: this.newModule.title || 'New module added.'
            });
            this.showAddModuleDialog = false;
            await this.loadCourses();
        } catch (error: any) {
            this.messageService.add({
                severity: 'error',
                summary: 'Create failed',
                detail: error.message || 'Failed to create module'
            });
        } finally {
            this.saving.set(false);
        }
    }

    // ---------------------------------------------------------------------------
    // EDIT / DELETE MODULE FROM LIST
    // ---------------------------------------------------------------------------
    selectModuleFromList(module: any) {
        const nodes = this.courseTree();
        let found: TreeNode | null = null;

        for (const courseNode of nodes) {
            const child = courseNode.children?.find(
                (m: any) => m.data && m.data._id === module._id
            );
            if (child) {
                found = child as TreeNode;
                break;
            }
        }

        if (found) {
            this.onNodeSelect({ node: found });
        } else {
            this.messageService.add({
                severity: 'warn',
                summary: 'Module not found',
                detail: 'Unable to locate module in tree.'
            });
        }
    }

    async onDeleteModule(module: any) {
        this.uploading.set(true);
        try {
            await this.trainingService.deleteModule(
                module._id as Id<'training_modules'>
            );
            this.messageService.add({
                severity: 'success',
                summary: 'Module deleted',
                detail: module.title
            });
            await this.loadCourses();
            this.selectedNode = null;
        } catch (error: any) {
            this.messageService.add({
                severity: 'error',
                summary: 'Delete failed',
                detail: error.message || 'Failed to delete module'
            });
        } finally {
            this.uploading.set(false);
        }
    }

    // ---------------------------------------------------------------------------
    // CONTENT TYPE TAG COLOR
    // ---------------------------------------------------------------------------
    getContentTypeColor(
        type: string
    ):
        | 'success'
        | 'secondary'
        | 'info'
        | 'warn'
        | 'danger'
        | 'contrast'
        | null {
        const colors: Record<string, any> = {
            course: 'info',
            video: 'info',
            document: 'secondary',
            quiz: 'warn',
            interactive: 'info'
        };
        return colors[type] || 'info';
    }

    // ---------------------------------------------------------------------------
    // SAVE CONTENT (placeholder)
    // ---------------------------------------------------------------------------
    async saveContent() {
        if (!this.selectedNode) return;
        this.saving.set(true);
        setTimeout(() => {
            this.saving.set(false);
            this.messageService.add({
                severity: 'success',
                summary: 'Saved',
                detail: 'Changes saved.'
            });
        }, 800);
    }
}
