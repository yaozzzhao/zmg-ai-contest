import React, { useState, useEffect, useRef } from 'react';
import { Task, ScheduleItem, DailyRecord } from './types';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import ScheduleView from './components/ScheduleView';
import TaskCompletionModal from './components/TaskCompletionModal';
import FocusModal from './components/FocusModal';
import HistoryView from './components/HistoryView';
import DailySummaryModal from './components/DailySummaryModal';
import { generateSchedule, checkSubjectBalance } from './services/schedulerService';
import { getEncouragement, generateDailySummary } from './services/geminiService';
import { getTestData } from './services/testData';
import { Activity, MessageCircle, Trophy, History, FlaskConical } from 'lucide-react';

// Helper for safe localStorage loading
const safeLoad = <T,>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.warn(`Failed to load ${key} from localStorage, using fallback.`, error);
    return fallback;
  }
};

const App: React.FC = () => {
  // --- State ---
  const [tasks, setTasks] = useState<Task[]>(() => safeLoad<Task[]>('hw_coach_tasks', []));
  const [history, setHistory] = useState<DailyRecord[]>(() => safeLoad<DailyRecord[]>('hw_coach_history', []));
  
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [balanceWarning, setBalanceWarning] = useState<string | null>(null);
  const [view, setView] = useState<'today' | 'history'>('today');
  
  // Modal State
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Summary Logic State
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [dailySummary, setDailySummary] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const hasTriggeredSummary = useRef(false);

  // --- Effects ---

  // Save Tasks to LocalStorage
  useEffect(() => {
    localStorage.setItem('hw_coach_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Save History to LocalStorage
  useEffect(() => {
    localStorage.setItem('hw_coach_history', JSON.stringify(history));
  }, [history]);

  // Sync Schedule Status
  useEffect(() => {
    if (schedule.length > 0) {
        setSchedule(prev => prev.map(item => {
            if (item.taskId) {
                const task = tasks.find(t => t.id === item.taskId);
                return task ? { ...item, completed: task.completed } : item;
            }
            return item;
        }));
    }
  }, [tasks]); // Run when tasks change

  // Check Balance Warning
  useEffect(() => {
    const { dominantSubject, maxPercentage } = checkSubjectBalance(tasks);
    if (dominantSubject && maxPercentage > 0.6) {
        setBalanceWarning(`⚠️ 今天 ${dominantSubject} 的任务占比高达 ${(maxPercentage * 100).toFixed(0)}%，建议适当分散到明天哦。`);
    } else {
        setBalanceWarning(null);
    }
  }, [tasks]);

  // ** Auto Summary & Archive Logic **
  useEffect(() => {
    const allCompleted = tasks.length > 0 && tasks.every(t => t.completed);
    
    // Trigger only if all tasks are completed and we haven't triggered this flow yet for this set of tasks
    if (allCompleted && !hasTriggeredSummary.current) {
      hasTriggeredSummary.current = true;
      handleAllTasksCompleted();
    } else if (!allCompleted) {
      // Reset trigger if user adds a new task or unchecks one
      hasTriggeredSummary.current = false;
    }
  }, [tasks]);


  // --- Handlers ---

  const handleAllTasksCompleted = async () => {
    setIsSummaryModalOpen(true);
    setIsGeneratingSummary(true);
    
    // Generate AI Summary
    const summary = await generateDailySummary(tasks);
    setDailySummary(summary);
    setIsGeneratingSummary(false);
  };

  const handleAddTask = (newTask: Task) => {
    setTasks(prev => [...prev, newTask]);
    setSchedule([]); 
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setSchedule(prev => prev.filter(s => s.taskId !== id));
  };

  const handleTaskClick = (task: Task) => {
    const cleanTask = { ...task, actualMinutes: undefined }; 
    setActiveTask(cleanTask);
    setIsCompletionModalOpen(true);
  };

  const handleFocusClick = (task: Task) => {
    setActiveTask(task);
    setIsFocusModalOpen(true);
  };

  const handleFocusComplete = (taskId: string, totalMinutes: number) => {
    setIsFocusModalOpen(false);
    if (activeTask && activeTask.id === taskId) {
        const updatedTask = { ...activeTask, actualMinutes: totalMinutes };
        setActiveTask(updatedTask);
        setTimeout(() => {
            setIsCompletionModalOpen(true);
        }, 100);
    }
  };

  const handleConfirmCompletion = async (taskId: string, actualMinutes: number, reason: string) => {
    setIsCompletionModalOpen(false);
    setActiveTask(null);
    
    setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
            return {
                ...t,
                completed: true,
                actualMinutes: actualMinutes,
                completionReason: reason,
                timeDiff: actualMinutes - t.estimatedMinutes,
                completedAt: Date.now()
            };
        }
        return t;
    }));

    // Trigger AI Encouragement (Only if not all tasks will be done after this one, otherwise summary handles it)
    // Actually, summary modal takes precedence if this is the last one.
    // We check this in the useEffect.
    const remainingCount = tasks.filter(t => !t.completed && t.id !== taskId).length;
    if (remainingCount > 0) {
       const task = tasks.find(t => t.id === taskId);
       if (task) {
           const completedCount = tasks.filter(t => t.completed).length + 1;
           const msg = await getEncouragement(task.name, completedCount, tasks.length);
           setAiMessage(msg);
           setTimeout(() => setAiMessage(null), 5000);
       }
    }
  };

  const handleGenerateSchedule = () => {
    const newSchedule = generateSchedule(tasks);
    setSchedule(newSchedule);
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const handleLoadDemoData = () => {
      if (tasks.length > 0) {
          if (!window.confirm('加载测试数据将覆盖当前任务，确定吗？')) return;
      }
      const data = getTestData();
      setTasks(data);
      setSchedule([]);
      setAiMessage("🧪 测试数据已加载，快试试生成计划吧！");
      setTimeout(() => setAiMessage(null), 3000);
  };

  // Archive current tasks to history and reset
  const handleArchiveAndReset = () => {
    const record: DailyRecord = {
        date: new Date().toISOString().split('T')[0],
        timestamp: Date.now(),
        tasks: [...tasks],
        totalEstimated: tasks.reduce((acc, t) => acc + t.estimatedMinutes, 0),
        totalActual: tasks.reduce((acc, t) => acc + (t.actualMinutes || 0), 0),
        completedCount: tasks.length,
        aiSummary: dailySummary // Save the generated summary
    };

    setHistory(prev => [record, ...prev]);

    // Reset State
    setTasks([]);
    setSchedule([]);
    setIsSummaryModalOpen(false);
    setDailySummary('');
    hasTriggeredSummary.current = false;
    
    setAiMessage("✅ 已归档至历史记录，开启新的一天！");
    setTimeout(() => setAiMessage(null), 3000);
  };

  // --- Render ---
  
  if (view === 'history') {
      return <HistoryView history={history} onBack={() => setView('today')} />;
  }

  // Main Workspace
  const completedMinutes = tasks.filter(t => t.completed).reduce((acc, t) => acc + t.estimatedMinutes, 0);
  const totalMinutes = tasks.reduce((acc, t) => acc + t.estimatedMinutes, 0);
  const progress = totalMinutes > 0 ? Math.round((completedMinutes / totalMinutes) * 100) : 0;

  return (
    <div className="min-h-screen pb-20 max-w-2xl mx-auto px-4 pt-6">
      {/* Header */}
      <header className="mb-8 text-center relative">
        <button 
            onClick={handleLoadDemoData}
            className="absolute right-14 top-2 p-2 rounded-full hover:bg-gray-100 text-gray-300 hover:text-indigo-600 transition-colors"
            title="生成测试数据 (Demo)"
        >
            <FlaskConical size={22} />
        </button>
        <button 
           onClick={() => setView('history')}
           className="absolute right-2 top-2 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors"
           title="历史记录"
        >
           <History size={24} />
        </button>
        <h1 className="text-3xl font-extrabold text-indigo-900 mb-2 tracking-tight flex items-center justify-center gap-2">
           🧊 学时魔方
        </h1>
        <p className="text-gray-500 text-sm">
           基于AI的学习任务编排大师
        </p>
      </header>

      {/* Stats Bar (Sticky) */}
      <div className="sticky top-4 z-30 bg-white/90 backdrop-blur-md shadow-sm border border-indigo-100 rounded-xl p-4 mb-6 flex items-center justify-between transition-all">
        <div>
          <div className="text-xs text-gray-500 uppercase font-semibold">今日进度</div>
          <div className="text-xl font-bold text-indigo-600 flex items-center gap-2">
            {progress}% 
            <span className="text-sm font-normal text-gray-400">({completedMinutes}/{totalMinutes} min)</span>
          </div>
        </div>
        <div className="w-1/3 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 transition-all duration-1000 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* AI Message Toast */}
      {aiMessage && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 w-full max-w-sm px-4 pointer-events-none">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-medium">
            <MessageCircle size={20} className="animate-bounce shrink-0" />
            <span>{aiMessage}</span>
          </div>
        </div>
      )}

      {/* Warnings */}
      {balanceWarning && (
        <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl flex items-start gap-3 text-sm">
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
          onTaskClick={handleTaskClick}
          onFocusClick={handleFocusClick}
        />

        {tasks.length > 0 && !tasks.every(t => t.completed) && (
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

        <ScheduleView schedule={schedule} />
      </main>

      {/* Completion Modal */}
      <TaskCompletionModal 
        isOpen={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
        onConfirm={handleConfirmCompletion}
        task={activeTask}
      />

      {/* Focus Modal */}
      <FocusModal
        isOpen={isFocusModalOpen}
        onClose={() => setIsFocusModalOpen(false)}
        onComplete={handleFocusComplete}
        task={activeTask}
      />

      {/* Daily Summary Modal */}
      <DailySummaryModal 
        isOpen={isSummaryModalOpen}
        summary={dailySummary}
        isLoading={isGeneratingSummary}
        onConfirm={handleArchiveAndReset}
      />
    </div>
  );
};

export default App;