// src/app/training/services/quiz.service.ts
import { Injectable } from '@angular/core';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { ConvexService } from 'src/app/core/services/convex.service';
import { QuizQuestionFrontend, AddQuestionRequest, QuizImportCSV } from '../interfaces/training.interface';

@Injectable({ providedIn: 'root' })
export class QuizService {
  constructor(private convex: ConvexService) {}

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  async getQuestions(moduleId: Id<'training_modules'>): Promise<QuizQuestionFrontend[]> {
    try {
      const result = await this.convex.client.query(api.training.quizzes.listByModule, { moduleId });
      return result as QuizQuestionFrontend[];
    } catch (error: any) {
      console.error('getQuestions failed:', error);
      throw new Error(`Failed to fetch questions: ${error.message}`);
    }
  }

  async addQuestion(payload: AddQuestionRequest): Promise<QuizQuestionFrontend> {
    try {
      const result = await this.convex.client.mutation(api.training.quizzes.create, {
        moduleId: payload.moduleId as Id<'training_modules'>,
        questionText: payload.questionText,
        questionType: payload.questionType as any,
        correctAnswer: payload.correctAnswer.toUpperCase(),
        options: payload.options,
        explanation: payload.explanation,
        points: payload.points,
        difficulty: payload.difficulty as any
      });

      return {
        _id: result.questionId,
        moduleId: payload.moduleId,
        questionText: payload.questionText,
        questionType: payload.questionType,
        correctAnswer: payload.correctAnswer.toUpperCase(),
        options: payload.options,
        points: payload.points,
        difficulty: payload.difficulty,
        explanation: payload.explanation
      } as QuizQuestionFrontend;
    } catch (error: any) {
      console.error('addQuestion failed:', error);
      throw new Error(`Failed to add question: ${error.message}`);
    }
  }

  async updateQuestion(questionId: Id<'quiz_questions'>, updates: Partial<QuizQuestionFrontend>): Promise<void> {
    try {
      const convexUpdates: any = {};
      
      if (updates.questionText) convexUpdates.questionText = updates.questionText;
      if (updates.questionType) convexUpdates.questionType = updates.questionType;
      if (updates.correctAnswer) convexUpdates.correctAnswer = updates.correctAnswer.toUpperCase();
      if (updates.options) convexUpdates.options = updates.options;
      if (updates.explanation !== undefined) convexUpdates.explanation = updates.explanation;
      if (updates.points) convexUpdates.points = updates.points;
      if (updates.difficulty) convexUpdates.difficulty = updates.difficulty;

      await this.convex.client.mutation(api.training.quizzes.update, { questionId, ...convexUpdates });
    } catch (error: any) {
      console.error('updateQuestion failed:', error);
      throw new Error(`Failed to update question: ${error.message}`);
    }
  }

  async deleteQuestion(questionId: Id<'quiz_questions'>): Promise<void> {
    try {
      await this.convex.client.mutation(api.training.quizzes.deleteQuestion, { questionId });
    } catch (error: any) {
      console.error('deleteQuestion failed:', error);
      throw new Error(`Failed to delete question: ${error.message}`);
    }
  }

  // ============================================================================
  // CSV IMPORT
  // ============================================================================

  async importCSV({ moduleId, file }: QuizImportCSV): Promise<number> {
    try {
      const csvContent = await this.readFileAsText(file);
      const questions = this.parseCSVQuestions(csvContent);
      
      const result = await this.convex.client.mutation(api.training.quizzes.importBulk, {
        moduleId: moduleId as Id<'training_modules'>,
        questions
      });

      return result.questionsImported || questions.length;
    } catch (error: any) {
      console.error('importCSV failed:', error);
      throw new Error(`Failed to import CSV: ${error.message}`);
    }
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  private parseCSVQuestions(csvContent: string): any[] {
    const lines = csvContent.trim().split('\n').slice(1);
    const questions: any[] = [];

    lines.forEach((line, index) => {
      try {
        const columns = this.parseCSVLine(line);
        if (columns.length < 2) return;

        const [questionText, questionTypeRaw, correctAnswer, optionA, optionB, optionC, optionD, pointsStr, explanation, difficultyRaw] = columns;
        const questionType = questionTypeRaw?.trim().toLowerCase();

        const typeMap: any = { 'multiple_choice': 'multiplechoice', 'true_false': 'truefalse', 'short_answer': 'shortanswer' };
        const mappedType = typeMap[questionType] || questionType;

        if (!['multiplechoice', 'truefalse', 'shortanswer'].includes(mappedType)) {
          console.warn(`⚠️ Invalid type: ${questionType}`);
          return;
        }

        const question: any = {
          questiontext: questionText?.trim() || '',
          questiontype: mappedType,
          correctanswer: correctAnswer?.trim() || '',
          points: Math.max(1, parseInt(pointsStr || '10') || 10),
          difficulty: (difficultyRaw?.trim().toLowerCase() || 'medium') as any
        };

        if (mappedType === 'multiplechoice') {
          const options = [optionA, optionB, optionC, optionD].map(s => s?.trim()).filter(Boolean);
          if (options.length >= 2) question.options = options;
        }

        if (explanation?.trim()) question.explanation = explanation.trim();
        questions.push(question);
      } catch (error) {
        console.warn(`⚠️ CSV parse error line ${index + 1}:`, error);
      }
    });

    return questions;
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }
}
