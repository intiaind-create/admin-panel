import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Tag } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TrainingService } from '../services/training.service';
import { QuizService } from '../services/quiz.service';
import { Id } from 'convex/_generated/dataModel';

@Component({
    selector: 'app-quiz-manager',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        ButtonModule,
        SelectModule,
        InputTextModule,
        InputNumberModule,
        DialogModule,
        FileUploadModule,
        ToastModule,
        ProgressSpinnerModule,
        Tag,
        ConfirmDialogModule
    ],
    templateUrl: './quiz-manager.component.html',
    styleUrls: ['./quiz-manager.component.scss'],
    providers: [MessageService, ConfirmationService]
})
export class QuizManagerComponent implements OnInit {
    // State
    courses = signal<any[]>([]);
    quizModules = signal<any[]>([]);
    selectedCourse = signal<any>(null);
    selectedModule = signal<any>(null);
    quizQuestions = signal<any[]>([]);
    loading = signal(false);
    loadingQuestions = signal(false);

    // Dialog
    showQuestionDialog = false;
    editMode = false;
    selectedQuestion: any = null;
    questionForm!: FormGroup;

    // Dropdowns
    coursesDropdown: any[] = [];
    modulesDropdown: any[] = [];

    questionTypes = [
        { label: 'Multiple Choice', value: 'multiplechoice' },
        { label: 'True/False', value: 'truefalse' },
        { label: 'Short Answer', value: 'shortanswer' }
    ];

    difficultyLevels = [
        { label: 'Easy', value: 'easy' },
        { label: 'Medium', value: 'medium' },
        { label: 'Hard', value: 'hard' }
    ];

    // ✅ FIX: Expose String to template
    readonly String = String;

    constructor(
        private trainingService: TrainingService,
        private quizService: QuizService,
        private fb: FormBuilder,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    async ngOnInit() {
        this.initForm();
        await this.loadCourses();
    }

    private initForm() {
        this.questionForm = this.fb.group({
            questionText: ['', Validators.required],
            questionType: ['multiplechoice', Validators.required],
            optionA: [''],
            optionB: [''],
            optionC: [''],
            optionD: [''],
            correctAnswer: ['', Validators.required],
            points: [10, [Validators.required, Validators.min(1)]],
            difficulty: ['medium'],
            explanation: ['']
        });

        this.questionForm
            .get('questionType')
            ?.valueChanges.subscribe((type) => {
                const optionControls = [
                    'optionA',
                    'optionB',
                    'optionC',
                    'optionD'
                ];
                if (type === 'multiplechoice') {
                    optionControls.forEach((c) =>
                        this.questionForm
                            .get(c)
                            ?.setValidators(Validators.required)
                    );
                } else {
                    optionControls.forEach((c) =>
                        this.questionForm.get(c)?.clearValidators()
                    );
                }
                optionControls.forEach((c) =>
                    this.questionForm.get(c)?.updateValueAndValidity()
                );
            });
    }

    async loadCourses() {
        this.loading.set(true);
        try {
            const courses = await this.trainingService.getCourses();
            this.courses.set(courses);
            this.coursesDropdown = courses.map((c) => ({
                label: c.title,
                value: c._id
            }));
        } catch (error: any) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: error.message
            });
        } finally {
            this.loading.set(false);
        }
    }

    // ✅ FIX: Type annotation for 'm'
    async onCourseChange(event: any) {
        const course = this.courses().find((c: any) => c._id === event.value);
        if (!course) return;

        this.selectedCourse.set(course);
        this.selectedModule.set(null);
        this.quizQuestions.set([]);

        const quizModules = (course.modules || [])
            .filter((m: any) => m.contentType === 'quiz')
            .map((m: any) => ({ _id: m._id, title: m.title }));

        this.quizModules.set(quizModules);
        // ✅ FIX: Explicit type annotation
        this.modulesDropdown = quizModules.map((m: any) => ({
            label: m.title,
            value: m._id
        }));
    }

    async onModuleChange(event: any) {
        const module = this.quizModules().find(
            (m: any) => m._id === event.value
        );
        if (!module) return;

        this.selectedModule.set(module);
        await this.loadQuestions(module._id);
    }

    async loadQuestions(moduleId: string) {
        this.loadingQuestions.set(true);
        try {
            const questions = await this.quizService.getQuestions(
                moduleId as Id<'training_modules'>
            );
            this.quizQuestions.set(questions);

            if (questions.length === 0) {
                this.messageService.add({
                    severity: 'info',
                    summary: 'No Questions',
                    detail: 'Add questions to get started!'
                });
            }
        } catch (error: any) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: error.message
            });
        } finally {
            this.loadingQuestions.set(false);
        }
    }

    // ============================================================================
    // EDIT/DELETE
    // ============================================================================

    editQuestion(question: any) {
        this.editMode = true;
        this.selectedQuestion = question;

        this.questionForm.patchValue({
            questionText: question.questionText,
            questionType: question.questionType,
            correctAnswer: question.correctAnswer,
            points: question.points,
            difficulty: question.difficulty,
            explanation: question.explanation || ''
        });

        if (question.options && question.options.length > 0) {
            this.questionForm.patchValue({
                optionA: question.options[0] || '',
                optionB: question.options[1] || '',
                optionC: question.options[2] || '',
                optionD: question.options[3] || ''
            });
        }

        this.showQuestionDialog = true;
    }

    deleteQuestion(question: any) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete this question?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
                try {
                    await this.quizService.deleteQuestion(question._id);
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Deleted',
                        detail: 'Question deleted successfully'
                    });
                    await this.loadQuestions(this.selectedModule()!._id);
                } catch (error: any) {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: error.message
                    });
                }
            }
        });
    }

    // ============================================================================
    // ADD QUESTION
    // ============================================================================

    showAddDialog() {
        if (!this.selectedModule()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'No Module',
                detail: 'Select a quiz module first'
            });
            return;
        }

        this.editMode = false;
        this.selectedQuestion = null;
        this.questionForm.reset({
            questionType: 'multiplechoice',
            points: 10,
            difficulty: 'medium'
        });
        this.showQuestionDialog = true;
    }

    async submitQuestion() {
        if (this.questionForm.invalid || !this.selectedModule()) return;

        const formValue = this.questionForm.value;
        const options =
            formValue.questionType === 'multiplechoice'
                ? [
                      formValue.optionA,
                      formValue.optionB,
                      formValue.optionC,
                      formValue.optionD
                  ].filter(Boolean)
                : undefined;

        try {
            if (this.editMode && this.selectedQuestion) {
                await this.quizService.updateQuestion(
                    this.selectedQuestion._id,
                    {
                        questionText: formValue.questionText,
                        questionType: formValue.questionType,
                        correctAnswer: formValue.correctAnswer,
                        options,
                        explanation: formValue.explanation,
                        points: formValue.points,
                        difficulty: formValue.difficulty
                    }
                );
                this.messageService.add({
                    severity: 'success',
                    summary: 'Updated',
                    detail: 'Question updated successfully!'
                });
            } else {
                await this.quizService.addQuestion({
                    moduleId: this.selectedModule()!._id,
                    questionText: formValue.questionText,
                    questionType: formValue.questionType,
                    correctAnswer: formValue.correctAnswer,
                    options,
                    explanation: formValue.explanation,
                    points: formValue.points,
                    difficulty: formValue.difficulty
                });
                this.messageService.add({
                    severity: 'success',
                    summary: 'Added',
                    detail: 'Question added successfully!'
                });
            }

            this.showQuestionDialog = false;
            await this.loadQuestions(this.selectedModule()!._id);
        } catch (error: any) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: error.message
            });
        }
    }

    // ============================================================================
    // CSV
    // ============================================================================

    async uploadCSV(event: any) {
        const file = event.files[0];
        if (!file || !this.selectedModule()) return;

        try {
            const count = await this.quizService.importCSV({
                moduleId: this.selectedModule()!._id,
                file
            });

            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: `Imported ${count} questions!`
            });
            await this.loadQuestions(this.selectedModule()!._id);
        } catch (error: any) {
            this.messageService.add({
                severity: 'error',
                summary: 'Import Failed',
                detail: error.message
            });
        }
    }

    downloadTemplate() {
        const csv = `question_text,question_type,correct_answer,option_a,option_b,option_c,option_d,points,explanation,difficulty
"What is the capital of India?","multiple_choice","B","Mumbai","New Delhi","Kolkata","Chennai",10,"New Delhi is the capital","easy"`;
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'quiz-template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    }

    // ============================================================================
    // UI HELPERS
    // ============================================================================

    // ✅ FIX: Return type for p-tag severity
    getTypeBadgeSeverity(
        type: string
    ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        const map: {
            [key: string]:
                | 'success'
                | 'info'
                | 'warn'
                | 'danger'
                | 'secondary'
                | 'contrast';
        } = {
            multiplechoice: 'info',
            truefalse: 'success',
            shortanswer: 'warn'
        };
        return map[type] || 'secondary';
    }

    // ✅ FIX: Return type for p-tag severity
    getDifficultyBadgeSeverity(
        difficulty: string
    ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        const map: {
            [key: string]:
                | 'success'
                | 'info'
                | 'warn'
                | 'danger'
                | 'secondary'
                | 'contrast';
        } = {
            easy: 'success',
            medium: 'info',
            hard: 'danger'
        };
        return map[difficulty] || 'secondary';
    }

    isMultipleChoice(): boolean {
        return (
            this.questionForm.get('questionType')?.value === 'multiplechoice'
        );
    }
}
