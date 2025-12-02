import React, { useState, useEffect } from 'react';
import { Task, ScheduleItem } from './types';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import ScheduleView from './components/ScheduleView';
import ReflectionModal from './components/ReflectionModal';
import TaskCompletionModal from './components/TaskCompletionModal';
import { generateSchedule, checkSubjectBalance } from './services/schedulerService';
import { getEncouragement, getDailyReflection } from './services/geminiService';
import { Activity, Trophy, MessageCircle } from 'lucide-react';

// Main App Component
const App: React.FC = () => {
  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [balanceWarning, setBalanceWarning] = useState<string | null>(null);
  
  // Modal States
  const [isReflectionOpen, setIsReflectionOpen] = useState(false);
  const [reflectionAdvice, setReflectionAdvice] = useState<string | null>(null);
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);

  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);

  // Load from LocalStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem('hw_coach_tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('hw_coach_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Check for alerts (deadlines & balance) periodically
  useEffect(() => {
    const checkStatus = () => {
      // Balance Check
      const { dominantSubject, maxPercentage } = checkSubjectBalance(tasks);
      if (dominantSubject && maxPercentage > 0.6) {
        setBalanceWarning(`⚠️ 今天 ${dominantSubject} 的作业占比高达 ${(maxPercentage * 100).toFixed(0)}%，建议适当分散到明天哦。`);
      } else {
        setBalanceWarning(null);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 300000); // 5 mins
    return () => clearInterval(interval);
  }, [tasks]);

  // Check if all done for reflection
  useEffect(() => {
    if (tasks.length > 0 && tasks.every(t => t.completed) && !isReflectionOpen && !reflectionAdvice) {
       // Small delay to allow user to see the last check tick
       const timer = setTimeout(() => setIsReflectionOpen(true), 1500);
       return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);


  // --- Handlers ---

  const handleAddTask = (newTask: Task) => {
    setTasks(prev => [...prev, newTask]);
    setSchedule([]); // Reset schedule when tasks change
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setSchedule(prev => prev.filter(s => s.taskId !== id));
  };

  const handleCheckTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    if (!task.completed) {
      // Logic for completing a task: Open Modal
      setTaskToComplete(task);
      setIsCompletionModalOpen(true);
    } else {
      // Logic for un-completing a task: Direct update
      const newStatus = false;
      
      setTasks(prev => prev.map(t => 
        t.id === id ? { ...t, completed: newStatus, actualMinutes: undefined, completionReason: undefined } : t
      ));
      
      setSchedule(prev => prev.map(s => s.taskId === id ? { ...s, completed: newStatus } : s));
    }
  };

  const handleConfirmCompletion = async (actualMinutes: number, reason: string) => {
    if (!taskToComplete) return;

    // 1. Update Task State
    setTasks(prev => prev.map(t => 
      t.id === taskToComplete.id 
        ? { ...t, completed: true, actualMinutes, completionReason: reason } 
        : t
    ));

    // 2. Update Schedule
    setSchedule(prev => prev.map(s => 
      s.taskId === taskToComplete.id ? { ...s, completed: true } : s
    ));

    // 3. Close Modal
    setIsCompletionModalOpen(false);
    setTaskToComplete(null);

    // 4. Trigger AI Encouragement with extra context
    const completedCount = tasks.filter(t => t.completed).length + 1;
    const msg = await getEncouragement(
      taskToComplete.name, 
      completedCount, 
      tasks.length,
      actualMinutes,
      taskToComplete.estimatedMinutes,
      reason
    );
    
    setAiMessage(msg);
    setTimeout(() => setAiMessage(null), 6000);
  };

  const handleGenerateSchedule = () => {
    const newSchedule = generateSchedule(tasks);
    setSchedule(newSchedule);
    
    // Auto-scroll to schedule
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const handleToggleScheduleItem = (itemId: string, taskId: string | null) => {
    // If it's a real task, toggle the task itself via the main handler
    if (taskId) {
      handleCheckTask(taskId);
    } else {
      // It's a break, just toggle locally in schedule
      setSchedule(prev => prev.map(item => item.id === itemId ? { ...item, completed: !item.completed } : item));
    }
  };

  const handleReflectionSubmit = async (feeling: string) => {
    setIsGeneratingAdvice(true);
    const completedTasks = tasks.map(t => ({ name: t.name, estimated: t.estimatedMinutes }));
    const advice = await getDailyReflection(completedTasks, feeling);
    setReflectionAdvice(advice);
    setIsGeneratingAdvice(false);
  };

  // --- Render ---

  const completedMinutes = tasks.filter(t => t.completed).reduce((acc, t) => acc + (t.actualMinutes || t.estimatedMinutes), 0);
  const totalEstimatedMinutes = tasks.reduce((acc, t) => acc + t.estimatedMinutes, 0);
  // Calculate progress based on count or time? Let's use count for bar, time for text
  const progressPercent = tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0;

  return (
    <div className="min-h-screen pb-20 max-w-2xl mx-auto px-4 pt-6 font-sans">
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-indigo-900 mb-2 tracking-tight">
          📚 作业时间管理教练
        </h1>
        <p className="text-gray-500 text-sm">
          科学规划 · 智能记录 · 高效学习
        </p>
      </header>

      {/* Stats Bar (Sticky) */}
      <div className="sticky top-4 z-30 bg-white/90 backdrop-blur-md shadow-sm border border-indigo-100 rounded-xl p-4 mb-6 flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500 uppercase font-semibold">今日任务进度</div>
          <div className="text-xl font-bold text-indigo-600 flex items-center gap-2">
            {progressPercent}% 
            <span className="text-sm font-normal text-gray-400">
               (已学 {completedMinutes} min)
            </span>
          </div>
        </div>
        <div className="w-1/3 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 transition-all duration-1000 ease-out" 
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* AI Message Toast */}
      {aiMessage && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 w-11/12 max-w-md">
          <div className="bg-indigo-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-start gap-3 text-sm font-medium border-2 border-indigo-400/30">
            <MessageCircle size={20} className="shrink-0 mt-0.5" />
            <span className="leading-snug">{aiMessage}</span>
          </div>
        </div>
      )}

      {/* Warnings */}
      {balanceWarning && (
        <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl flex items-start gap-3 text-sm animate-in fade-in">
          <Activity className="shrink-0 mt-0.5" size={18} />
          {balanceWarning}
        </div>
      )}

      {/* Main Content */}
      <main>
        <TaskForm onAddTask={handleAddTask} />
        
        <TaskList 
          tasks={tasks} 
          onDelete={handleDeleteTask} 
          onCheck={handleCheckTask} 
        />

        {tasks.length > 0 && (
          <div className="mt-8">
            <button 
              onClick={handleGenerateSchedule}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 rounded-xl shadow-lg font-bold text-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Trophy size={20} />
              生成今日学习计划
            </button>
          </div>
        )}

        <ScheduleView 
          schedule={schedule} 
          onToggleScheduleItem={handleToggleScheduleItem} 
        />
      </main>

      {/* Modals */}
      <TaskCompletionModal
        isOpen={isCompletionModalOpen}
        task={taskToComplete}
        onClose={() => {
          setIsCompletionModalOpen(false);
          setTaskToComplete(null);
        }}
        onConfirm={handleConfirmCompletion}
      />

      <ReflectionModal 
        isOpen={isReflectionOpen} 
        onClose={() => setIsReflectionOpen(false)}
        onSubmit={handleReflectionSubmit}
        aiAdvice={reflectionAdvice}
        loading={isGeneratingAdvice}
      />
    </div>
  );
};

export default App;