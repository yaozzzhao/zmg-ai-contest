import React, { useState, useEffect } from 'react';
import { Task, ScheduleItem, DailyRecord } from './types';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import ScheduleView from './components/ScheduleView';
import TaskCompletionModal from './components/TaskCompletionModal';
import FocusModal from './components/FocusModal';
import SummaryTable from './components/SummaryTable';
import HistoryView from './components/HistoryView';
import { generateSchedule, checkSubjectBalance } from './services/schedulerService';
import { getEncouragement } from './services/geminiService';
import { Activity, MessageCircle, Trophy, RefreshCw, History } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [balanceWarning, setBalanceWarning] = useState<string | null>(null);
  const [history, setHistory] = useState<DailyRecord[]>([]);
  const [view, setView] = useState<'today' | 'history'>('today');
  
  // Modal State
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // App Lifecycle State
  const [allCompleted, setAllCompleted] = useState(false);

  // --- Effects ---

  // Load from LocalStorage
  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem('hw_coach_tasks');
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);
        if (Array.isArray(parsedTasks)) {
          setTasks(parsedTasks);
          // If tasks exist and all are completed, show summary immediately
          if (parsedTasks.length > 0 && parsedTasks.every((t: Task) => t.completed)) {
            setAllCompleted(true);
          }
        }
      }

      const savedHistory = localStorage.getItem('hw_coach_history');
      if (savedHistory) {
          setHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error("Failed to load data", e);
    }
  }, []);

  // Save Tasks to LocalStorage
  useEffect(() => {
    localStorage.setItem('hw_coach_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Save History to LocalStorage
  useEffect(() => {
    localStorage.setItem('hw_coach_history', JSON.stringify(history));
  }, [history]);

  // Sync Schedule Status & Check Completion
  useEffect(() => {
    // 1. Sync Schedule
    if (schedule.length > 0) {
        setSchedule(prev => prev.map(item => {
            if (item.taskId) {
                const task = tasks.find(t => t.id === item.taskId);
                return task ? { ...item, completed: task.completed } : item;
            }
            return item;
        }));
    }

    // 2. Check All Completed
    if (tasks.length > 0 && tasks.every(t => t.completed)) {
        if (!allCompleted) {
            setAllCompleted(true);
            setAiMessage("🎉 所有任务已完成！生成报告中...");
        }
    } else {
        if (tasks.length > 0 && allCompleted) {
             setAllCompleted(false);
        } else if (tasks.length === 0) {
             setAllCompleted(false);
        }
    }
    
    // 3. Balance Warning
    const { dominantSubject, maxPercentage } = checkSubjectBalance(tasks);
    if (dominantSubject && maxPercentage > 0.6) {
        setBalanceWarning(`⚠️ 今天 ${dominantSubject} 的作业占比高达 ${(maxPercentage * 100).toFixed(0)}%，建议适当分散到明天哦。`);
    } else {
        setBalanceWarning(null);
    }
  }, [tasks]);


  // --- Handlers ---

  const handleAddTask = (newTask: Task) => {
    setTasks(prev => [...prev, newTask]);
    setSchedule([]); 
    setAllCompleted(false);
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setSchedule(prev => prev.filter(s => s.taskId !== id));
  };

  const handleTaskClick = (task: Task) => {
    // When clicking task text, open completion modal directly (manual entry)
    // We update the task to ensure no residual actualMinutes from previous cancelled states
    const cleanTask = { ...task, actualMinutes: undefined }; 
    setActiveTask(cleanTask);
    setIsCompletionModalOpen(true);
  };

  const handleFocusClick = (task: Task) => {
    setActiveTask(task);
    setIsFocusModalOpen(true);
  };

  const handleFocusComplete = (taskId: string, totalMinutes: number) => {
    // Close focus modal
    setIsFocusModalOpen(false);
    
    // Open completion modal, but pre-fill the time
    if (activeTask && activeTask.id === taskId) {
        const updatedTask = { ...activeTask, actualMinutes: totalMinutes };
        setActiveTask(updatedTask);
        
        // Small delay to allow modal transition
        setTimeout(() => {
            setIsCompletionModalOpen(true);
        }, 100);
    }
  };

  const handleConfirmCompletion = async (taskId: string, actualMinutes: number, reason: string) => {
    setIsCompletionModalOpen(false);
    setActiveTask(null);
    
    // Update Task
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

    // Trigger AI Encouragement
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        const completedCount = tasks.filter(t => t.completed).length + 1;
        const msg = await getEncouragement(task.name, completedCount, tasks.length);
        setAiMessage(msg);
        setTimeout(() => setAiMessage(null), 5000);
    }
  };

  const handleGenerateSchedule = () => {
    const newSchedule = generateSchedule(tasks);
    setSchedule(newSchedule);
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const handleReset = () => {
      if (window.confirm('确定要清空所有数据开始新的一天吗？(当前记录将自动保存到历史)')) {
          
          // 1. Prepare History Record
          // Use current state 'tasks' which contains the completed items
          const record: DailyRecord = {
              date: new Date().toISOString().split('T')[0],
              tasks: [...tasks],
              totalEstimated: tasks.reduce((acc, t) => acc + t.estimatedMinutes, 0),
              totalActual: tasks.reduce((acc, t) => acc + (t.actualMinutes || 0), 0),
              completedCount: tasks.filter(t => t.completed).length
          };

          // 2. Update History State & LocalStorage Immediately
          const newHistory = [...history];
          // Check if today already exists, if so overwrite, else append
          const existingIndex = newHistory.findIndex(r => r.date === record.date);
          if (existingIndex >= 0) {
              newHistory[existingIndex] = record;
          } else {
              newHistory.push(record);
          }
          
          setHistory(newHistory);
          localStorage.setItem('hw_coach_history', JSON.stringify(newHistory));

          // 3. Reset App State
          setTasks([]);
          setSchedule([]);
          setAllCompleted(false);
          setAiMessage(null);
          
          // 4. Clear Tasks Storage Immediately
          localStorage.setItem('hw_coach_tasks', '[]');
          
          // 5. Navigate
          setView('today');
      }
  };

  // --- Render ---
  
  if (view === 'history') {
      return <HistoryView history={history} onBack={() => setView('today')} />;
  }

  // 1. Summary View (All Completed)
  if (allCompleted) {
      return (
          <div className="min-h-screen bg-gray-50 pb-20 pt-10 px-4">
              <header className="mb-8 text-center relative">
                 <button 
                    onClick={() => setView('history')}
                    className="absolute right-0 top-0 text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                     <History size={24} />
                  </button>
                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-2 tracking-tight">
                    学时魔方
                </h1>
                <p className="text-gray-500 text-sm">基于AI的学习任务编排大师</p>
              </header>

              <SummaryTable tasks={tasks} />

              <div className="max-w-4xl mx-auto mt-10 flex justify-center pb-10">
                  <button 
                    onClick={handleReset}
                    className="flex items-center gap-2 px-8 py-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 hover:border-indigo-300 hover:text-indigo-600 shadow-sm transition-all active:scale-95 group"
                  >
                      <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                      开始新的一天
                  </button>
              </div>
          </div>
      );
  }

  // 2. Main Workspace
  const completedMinutes = tasks.filter(t => t.completed).reduce((acc, t) => acc + t.estimatedMinutes, 0);
  const totalMinutes = tasks.reduce((acc, t) => acc + t.estimatedMinutes, 0);
  const progress = totalMinutes > 0 ? Math.round((completedMinutes / totalMinutes) * 100) : 0;

  return (
    <div className="min-h-screen pb-20 max-w-2xl mx-auto px-4 pt-6">
      {/* Header */}
      <header className="mb-8 text-center relative">
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
      <div className="sticky top-4 z-30 bg-white/90 backdrop-blur-md shadow-sm border border-indigo-100 rounded-xl p-4 mb-6 flex items-center justify-between">
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
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 w-full max-w-sm px-4">
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
    </div>
  );
};

export default App;