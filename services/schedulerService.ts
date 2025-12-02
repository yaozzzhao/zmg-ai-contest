import { Task, ScheduleItem } from '../types';

// Helper to format time
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
};

// Calculate Priority Score
export const calculatePriority = (task: Task): number => {
  const now = new Date().getTime();
  const deadline = new Date(task.deadline).getTime();
  const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);

  // Avoid division by zero or negative urgency if overdue
  const safeHours = Math.max(0.1, hoursUntilDeadline);
  
  // Weights
  const importanceWeight = 1.5;
  const urgencyWeight = 1.2; // Higher urgency weight
  const difficultyWeight = 0.5;

  // Urgency score: 1 hour left = 100, 100 hours left = 1
  const urgencyScore = 100 / (safeHours + 0.5);

  const score = (task.importance * importanceWeight * 10) + 
                (urgencyScore * urgencyWeight) + 
                (task.difficulty * difficultyWeight * 5);

  return score;
};

// Generate Schedule
export const generateSchedule = (tasks: Task[]): ScheduleItem[] => {
  // 1. Filter incomplete tasks and sort by priority
  const activeTasks = tasks.filter(t => !t.completed);
  const sortedTasks = activeTasks.sort((a, b) => calculatePriority(b) - calculatePriority(a));

  const schedule: ScheduleItem[] = [];
  let currentTime = new Date();
  
  // Round up to next 5 minutes
  const coeff = 1000 * 60 * 5;
  currentTime = new Date(Math.ceil(currentTime.getTime() / coeff) * coeff);

  // Hard limit: 22:30 (10:30 PM)
  const today = new Date();
  const endTimeLimit = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 22, 30, 0);

  let consecutiveWorkMinutes = 0;

  for (const task of sortedTasks) {
    if (currentTime.getTime() >= endTimeLimit.getTime()) break;

    let remainingTaskTime = task.estimatedMinutes;
    
    // Split large tasks (> 45 mins) or fit into remaining timeline
    while (remainingTaskTime > 0) {
      if (currentTime.getTime() >= endTimeLimit.getTime()) break;

      // Determine block duration (max 40-45 mins for Pomodoro-ish feel)
      const maxBlock = 40;
      const blockDuration = Math.min(remainingTaskTime, maxBlock);

      // Check if we need a break BEFORE this block?
      // Simple logic: if we just worked > 40 mins, take a break
      if (consecutiveWorkMinutes >= 40) {
        const breakStart = new Date(currentTime);
        const breakDuration = 10;
        currentTime.setMinutes(currentTime.getMinutes() + breakDuration);
        
        schedule.push({
          id: `break-${breakStart.getTime()}`,
          taskId: null,
          name: "休息一下 ☕️",
          startTime: formatTime(breakStart),
          endTime: formatTime(currentTime),
          isBreak: true,
          completed: false
        });
        consecutiveWorkMinutes = 0;
      }

      // Add Task Block
      const taskStart = new Date(currentTime);
      currentTime.setMinutes(currentTime.getMinutes() + blockDuration);
      
      schedule.push({
        id: `schedule-${task.id}-${taskStart.getTime()}`,
        taskId: task.id,
        subject: task.subject,
        name: remainingTaskTime > maxBlock 
          ? `${task.name} (分段 ${Math.ceil((task.estimatedMinutes - remainingTaskTime) / maxBlock) + 1})` 
          : task.name,
        startTime: formatTime(taskStart),
        endTime: formatTime(currentTime),
        isBreak: false,
        completed: false,
        originalTask: task
      });

      remainingTaskTime -= blockDuration;
      consecutiveWorkMinutes += blockDuration;
    }
  }

  return schedule;
};

// Check Balance
export const checkSubjectBalance = (tasks: Task[]) => {
    const subjectTimes: Record<string, number> = {};
    let totalTime = 0;

    tasks.filter(t => !t.completed).forEach(t => {
        subjectTimes[t.subject] = (subjectTimes[t.subject] || 0) + t.estimatedMinutes;
        totalTime += t.estimatedMinutes;
    });

    let dominantSubject = null;
    let maxPercentage = 0;

    for (const [subject, time] of Object.entries(subjectTimes)) {
        const percentage = time / totalTime;
        if (percentage > 0.60 && totalTime > 60) { // Only warn if dominant > 60% and total work > 1 hr
            dominantSubject = subject;
            maxPercentage = percentage;
        }
    }

    return { dominantSubject, maxPercentage, totalTime };
};
