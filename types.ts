export interface Task {
  id: string;
  subject: string;
  name: string;
  importance: number; // 1-5
  difficulty: number; // 1-5
  deadline: string; // ISO string
  estimatedMinutes: number;
  completed: boolean;
  createdAt: number;
  
  // New fields for actual tracking
  actualMinutes?: number;
  timeDiff?: number; // actual - estimated
  completionReason?: string; // "Focused well", "Distracted", etc.
  completedAt?: number; // Timestamp
}

export interface ScheduleItem {
  id: string;
  taskId: string | null; // null represents a break
  subject?: string;
  name: string; // Task name or "休息时间"
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isBreak: boolean;
  completed: boolean;
  originalTask?: Task;
}

export interface AnalysisResult {
  totalMinutes: number;
  completedMinutes: number;
  urgentCount: number;
  dominantSubject: string | null;
  dominantPercentage: number;
}

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  tasks: Task[];
  totalEstimated: number;
  totalActual: number;
  completedCount: number;
}