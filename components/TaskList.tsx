import React from 'react';
import { Task } from '../types';
import { Trash2, AlertCircle, BrainCircuit, CheckCircle2, Circle, PlayCircle } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  onDelete: (id: string) => void;
  onTaskClick: (task: Task) => void;
  onFocusClick?: (task: Task) => void; // New prop for focus
  urgentThresholdHours?: number; 
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onDelete, onTaskClick, onFocusClick, urgentThresholdHours = 3 }) => {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
        <p>还没有任务哦，快去添加吧！🎉</p>
      </div>
    );
  }

  const getTimeLeft = (deadlineStr: string) => {
    const diff = new Date(deadlineStr).getTime() - Date.now();
    const hours = diff / (1000 * 60 * 60);
    return hours;
  };

  return (
    <div className="space-y-3 mb-8">
      <h3 className="font-bold text-gray-700 pl-1 border-l-4 border-indigo-500 ml-1">任务清单 ({tasks.filter(t => !t.completed).length} 待办)</h3>
      <div className="grid grid-cols-1 gap-3">
        {tasks.map((task) => {
          const hoursLeft = getTimeLeft(task.deadline);
          const isUrgent = !task.completed && hoursLeft < urgentThresholdHours && hoursLeft > 0;
          const isHard = task.difficulty >= 4 && task.estimatedMinutes >= 60;

          return (
            <div 
              key={task.id}
              className={`relative p-4 rounded-xl border transition-all ${
                task.completed 
                  ? 'bg-gray-50 border-gray-200 opacity-90' 
                  : isUrgent
                    ? 'bg-red-50 border-red-200 shadow-sm'
                    : 'bg-white border-gray-200 hover:shadow-md hover:border-indigo-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-grow">
                   {/* Checkbox / Status Icon */}
                  <button 
                    disabled={task.completed}
                    onClick={() => !task.completed && onTaskClick(task)}
                    className={`mt-1 transition-colors ${task.completed ? 'text-green-500 cursor-default' : 'text-gray-300 hover:text-indigo-500'}`}
                  >
                    {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                  </button>

                  <div className="flex-grow cursor-pointer" onClick={() => !task.completed && onTaskClick(task)}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        task.completed ? 'bg-gray-200 text-gray-500' : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {task.subject}
                      </span>
                      <h4 className={`font-semibold ${task.completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                        {task.name}
                      </h4>
                    </div>
                    
                    <div className="text-sm text-gray-500 mt-1 flex items-center gap-3 flex-wrap">
                      {task.completed ? (
                         <div className="flex items-center gap-2 text-xs">
                            <span className="font-mono bg-gray-100 px-1 rounded">预计 {task.estimatedMinutes}m</span>
                            <span>→</span>
                            <span className={`font-mono px-1 rounded font-bold ${
                                (task.actualMinutes || 0) <= task.estimatedMinutes ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                            }`}>实际 {task.actualMinutes}m</span>
                         </div>
                      ) : (
                        <>
                            <span>⏱ 预计 {task.estimatedMinutes}分</span>
                            <span>⭐️ 难度 {task.difficulty}</span>
                            <span className={`${isUrgent ? 'text-red-600 font-bold' : ''}`}>
                                📅 {new Date(task.deadline).toLocaleTimeString('zh-CN', {month: 'numeric', day: 'numeric', hour:'2-digit', minute:'2-digit'})}
                            </span>
                        </>
                      )}
                    </div>

                    {/* AI Insights / Suggestions */}
                    {!task.completed && (
                        <div className="flex gap-2 mt-2">
                             {isUrgent && (
                                <div className="text-xs text-red-600 flex items-center gap-1 bg-red-100 px-2 py-1 rounded">
                                    <AlertCircle size={12} />
                                    <span>快截止了，优先做这个！</span>
                                </div>
                             )}
                             {isHard && (
                                <div className="text-xs text-amber-600 flex items-center gap-1 bg-amber-100 px-2 py-1 rounded">
                                    <BrainCircuit size={12} />
                                    <span>任务较重，建议分段完成</span>
                                </div>
                             )}
                        </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                    {/* Focus Button */}
                    {!task.completed && onFocusClick && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onFocusClick(task);
                            }}
                            className="text-indigo-400 hover:text-indigo-600 transition-colors p-2 rounded-full hover:bg-indigo-50"
                            title="开启专注模式 (番茄钟)"
                        >
                            <PlayCircle size={22} />
                        </button>
                    )}

                    {/* Delete Button */}
                    {!task.completed && (
                        <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(task.id);
                        }}
                        className="text-gray-300 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                        aria-label="Delete task"
                        >
                        <Trash2 size={18} />
                        </button>
                    )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskList;