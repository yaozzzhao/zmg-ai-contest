import { v4 as uuidv4 } from 'uuid';
import { Task } from '../types';

export const getTestData = (): Task[] => {
  const now = new Date();
  
  // Helper to create a date relative to now in hours
  const getDeadline = (hoursFromNow: number) => {
    const d = new Date(now.getTime() + hoursFromNow * 60 * 60 * 1000);
    return d.toISOString();
  };

  return [
    {
      id: uuidv4(),
      subject: '数学',
      name: '完成三角函数练习卷 (精选)',
      importance: 5, // High importance
      difficulty: 4, // Hard
      deadline: getDeadline(3), // Due in 3 hours (Urgent)
      estimatedMinutes: 45,
      completed: false,
      createdAt: Date.now()
    },
    {
      id: uuidv4(),
      subject: '英语',
      name: '背诵 Unit 3 单词 & 听写准备',
      importance: 3,
      difficulty: 2,
      deadline: getDeadline(5), // Due in 5 hours
      estimatedMinutes: 20,
      completed: false,
      createdAt: Date.now()
    },
    {
      id: uuidv4(),
      subject: '物理',
      name: '整理力学实验错题本',
      importance: 4,
      difficulty: 3,
      deadline: getDeadline(24), // Due tomorrow
      estimatedMinutes: 30,
      completed: false,
      createdAt: Date.now()
    },
    {
      id: uuidv4(),
      subject: '语文',
      name: '阅读《乡土中国》第一章并写札记',
      importance: 2,
      difficulty: 3,
      deadline: getDeadline(48), // Due later
      estimatedMinutes: 40,
      completed: false,
      createdAt: Date.now()
    }
  ];
};