import { Id } from 'convex/_generated/dataModel';

export interface Course {
    _id: Id<'training_courses'>;
    _creationTime: number;
    title: string;
    description: string;
    category: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    passingScore: number;
    estimatedHours: number;
    rootId: string;
    isActive: boolean;
    isDeleted: boolean;
    certificateTemplateId?: Id<'_storage'>;
    totalEnrollments: number;
    completionRate: number;
    averageScore: number;
    createdAt: number;
    updatedAt: number;
    modules?: Module[];
}

export interface TrainingProgress {
    _id: Id<'training_progress'>;
    _creationTime: number;
    executiveId: Id<'executives'>;
    courseId: Id<'training_courses'>;
    status: 'not_started' | 'in_progress' | 'completed' | 'failed';
    completedModules: number;
    totalModules: number;
    progressPercentage: number;
    finalScore?: number;
    startedAt: number;
    completedAt?: number;
    certificateId?: Id<'_storage'>;
    createdAt: number;
    updatedAt: number;
    executiveName?: string;
    courseTitle?: string;
}

export interface QuizQuestion {
    _id: string;
    module_id: string; // ✅ DB field (snake_case)
    question_text: string; // ✅ DB field (snake_case)
    question_type: QuizQuestionType;
    correct_answer: string; // ✅ DB field (snake_case)
    options?: string[]; // ✅ JSON field
    points: number; // ✅ DB field
    difficulty?: 'easy' | 'medium' | 'hard'; // ✅ DB field
    explanation?: string; // ✅ DB field
    createdAt?: number;
    updatedAt?: number;
}
export interface QuizImportCSV {
    moduleId: string;
    file: File;
}

export interface AddQuestionRequest {
    moduleId: string;
    questionText: string;
    questionType: QuizQuestionType;
    correctAnswer: string;
    options?: string[];
    explanation?: string;
    points: number;
    difficulty?: 'easy' | 'medium' | 'hard';
}

export interface QuizQuestionFrontend {
    _id: string;
    moduleId: string;
    questionText: string;
    questionType: QuizQuestionType;
    correctAnswer: string;
    options?: string[];
    points: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    explanation?: string;
    createdAt?: number;
    updatedAt?: number;
}

export interface ContentTreeNode {
    label: string;
    key: string;
    data: Course | any; // Course for root, module for children
    expanded?: boolean;
    leaf?: boolean;
    children?: ContentTreeNode[];
    courseTitle?: string; // For modules
}

export interface Module {
    _id: Id<'training_modules'>;
    title: string;
    description: string;
    order: number;
    estimatedMinutes: number;
    contentType: 'video' | 'document' | 'quiz' | 'interactive';
    contentId?: Id<'_storage'>;
    isRequired: boolean;
    createdAt: number;
    updatedAt: number;
}

export type QuizQuestionType = 'multiplechoice' | 'truefalse' | 'shortanswer';

export interface TrainingProgress {
    _id: Id<'training_progress'>;
    _creationTime: number;
    rootId: Id<'hierarchies'>;
    hierarchyId: Id<'hierarchies'>;
    executiveId: Id<'executives'>;
    courseId: Id<'training_courses'>;
    completedModules: number;
    totalModules: number;
    progressPercentage: number;
    status: 'not_started' | 'in_progress' | 'completed' | 'failed';
    startedAt: number;
    lastAccessedAt: number;
    completedAt?: number;
    finalScore?: number;
    certificateId?: Id<'_storage'>;
    createdAt: number;
    updatedAt: number;
    // Enriched fields
    executiveName?: string;
    executiveEmployeeId?: string;
    courseTitle?: string;
}

export interface ModuleProgress {
    _id: Id<'training_module_progress'>;
    progressId: Id<'training_progress'>;
    moduleId: Id<'training_modules'>;
    executiveId: Id<'executives'>;
    status: 'not_started' | 'in_progress' | 'completed';
    timeSpentMinutes: number;
    score?: number;
    startedAt?: number;
    completedAt?: number;
    createdAt: number;
    updatedAt: number;
}

export interface PaginatedProgress {
    page: TrainingProgress[];
    continueCursor: string;
    isDone: boolean;
}
