/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

// Core learning plan and history types

export interface LearningPlanInput {
  totalPlan: string; // 全周期总学习计划表
  examScope: string; // 考试范围
  examDate: string; // 考试时间 (ISO 8601)
  dailyTheme?: string; // 当日学习主题
  dailyGoal?: string; // 当日核心目标
}

export interface CompletedTask {
  id: string;
  taskContent: string;
  completedAt: string; // ISO 8601
  duration?: number; // 分钟
  notes?: string;
}

export interface DailyLearningPlan {
  id: string;
  date: string; // ISO 8601
  theme: string; // 学习主题
  goal: string; // 核心目标
  tasks: string[]; // 任务列表
  generatedAt: string; // 生成时间
  status: 'pending' | 'in_progress' | 'completed';
}

export interface LearningHistory {
  totalCompleted: CompletedTask[];
  dailyPlans: DailyLearningPlan[];
  lastUpdated: string;
}

export interface AIGenerationRequest {
  totalPlan: string;
  examScope: string;
  examDate: string;
  dailyTheme: string;
  dailyGoal: string;
  completedHistory: CompletedTask[];
  daysUntilExam: number;
}

export interface AIGenerationResponse {
  rawOutput: string;
  parsedTasks: string[];
  isValid: boolean;
  validationErrors?: string[];
}

export interface GenToDoStorage {
  version: number;
  lastUpdated: string;
  learningInput: LearningPlanInput;
  learningHistory: LearningHistory;
  dailyPlan: DailyLearningPlan | null;
}
