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
  const urgencyWeight = 2.0; // Increased urgency weight
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
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  // 1. Filter tasks
  const activeTasks = tasks.filter(t => !t.completed).filter(t => {
      const deadlineDate = new Date(t.deadline);
      const isDueToday = deadlineDate.getTime() <= endOfToday.getTime();
      const hoursUntil = (deadlineDate.getTime() - now.getTime()) / 36e5;
      
      // Rule: If deadline is overdue or due today, ALWAYS schedule it.
      if (hoursUntil < 0 || isDueToday) return true;

      // Rule: If deadline is within next 24 hours (e.g. tomorrow morning), schedule it.
      if (hoursUntil < 24) return true;

      // Rule: If deadline is far away (> 24h after end of today) AND Importance is high (5), schedule it.
      if (t.importance >= 5) return true;

      // Otherwise (e.g. due in 2 days and normal importance), skip for today's schedule.
      return false;
  });

  const sortedTasks = activeTasks.sort((a, b) => calculatePriority(b) - calculatePriority(a));

  const schedule: ScheduleItem[] = [];
  let currentTime = new Date();
  
  // Round up to next 5 minutes
  const coeff = 1000 * 60 * 5;
  currentTime = new Date(Math.ceil(currentTime.getTime() / coeff) * coeff);

  // Soft limit: 23:00 (11:00 PM) - try to finish by then, but extend if needed for today's deadlines
  const today = new Date();
  let endTimeLimit = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 0, 0);
  
  // If current time is already late, extend limit
  if (currentTime.getTime() > endTimeLimit.getTime() - 3600000) {
      endTimeLimit = new Date(currentTime.getTime() + 5 * 60 * 60 * 1000); // Add 5 hours buffer
  }

  let consecutiveWorkMinutes = 0;

  for (const task of sortedTasks) {
    let remainingTaskTime = task.estimatedMinutes;
    
    // Check if task fits roughly
    // We iterate through the task duration in blocks
    while (remainingTaskTime > 0) {
      // Determine block duration (max 45 mins)
      const maxBlock = 45;
      const blockDuration = Math.min(remainingTaskTime, maxBlock);

      // Check for break needs
      if (consecutiveWorkMinutes >= 45) {
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
      
      const isSplit = remainingTaskTime > maxBlock || task.estimatedMinutes > maxBlock;
      // Calculate split index if necessary (rough estimation)
      const partInfo = isSplit 
         ? ` (进行中)` 
         : '';

      schedule.push({
        id: `schedule-${task.id}-${taskStart.getTime()}`,
        taskId: task.id,
        subject: task.subject,
        name: task.name + partInfo,
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