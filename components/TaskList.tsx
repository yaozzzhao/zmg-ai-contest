import React from 'react';
import { Task } from '../types';
import { Trash2, AlertCircle, BrainCircuit, CheckCheck } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  onDelete: (id: string) => void;
  onCheck: (id: string) => void;
  urgentThresholdHours?: number; // Configurable threshold
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onDelete, onCheck, urgentThresholdHours = 3 }) => {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
        <p>还没有作业哦，快去添加吧！🎉</p>
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
      <h3 className="font-bold text-gray-700 pl-1">作业清单 ({tasks.filter(t => !t.completed).length} 待办)</h3>
      <div className="grid grid-cols-1 gap-3">
        {tasks.map((task) => {
          const hoursLeft = getTimeLeft(task.deadline);
          const isUrgent = !task.completed && hoursLeft < urgentThresholdHours && hoursLeft > 0;
          const isHard = task.difficulty >= 4 && task.estimatedMinutes >= 60;
          
          // Analysis logic for display
          const diff = task.actualMinutes !== undefined ? task.actualMinutes - task.estimatedMinutes : 0;

          return (
            <div 
              key={task.id}
              className={`relative p-4 rounded-xl border transition-all ${
                task.completed 
                  ? 'bg-gray-50 border-gray-100' 
                  : isUrgent
                    ? 'bg-red-50 border-red-200 shadow-sm'
                    : 'bg-white border-gray-200 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 w-full">
                  <input 
                    type="checkbox" 
                    checked={task.completed}
                    onChange={() => onCheck(task.id)}
                    className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300 cursor-pointer shrink-0"
                  />
                  <div className="w-full">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        task.completed ? 'bg-gray-200 text-gray-500' : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {task.subject}
                      </span>
                      <h4 className={`font-semibold ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                        {task.name}
                      </h4>
                    </div>
                    
                    <div className="text-sm text-gray-500 mt-1 flex items-center gap-3 flex-wrap">
                      <span>⏱ 预计 {task.estimatedMinutes}m</span>
                      <span>⭐️ 难度 {task.difficulty}</span>
                      {!task.completed && (
                        <span className={`${isUrgent ? 'text-red-600 font-bold' : ''}`}>
                           📅 {new Date(task.deadline).toLocaleTimeString('zh-CN', {month: 'numeric', day: 'numeric', hour:'2-digit', minute:'2-digit'})}
                        </span>
                      )}
                    </div>

                    {/* Completion Stats */}
                    {task.completed && task.actualMinutes !== undefined && (
                      <div className="mt-2 text-xs flex items-center gap-2 bg-indigo-50 p-2 rounded-lg border border-indigo-100 w-fit">
                        <CheckCheck size={14} className="text-indigo-500" />
                        <span className="text-gray-600">实际: <span className="font-bold">{task.actualMinutes}m</span></span>
                        <span className={`font-medium ${diff < 0 ? 'text-green-600' : diff > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                          ({diff === 0 ? '准时' : diff < 0 ? `提前 ${Math.abs(diff)}m` : `延后 ${diff}m`})
                        </span>
                        {task.completionReason && (
                          <span className="text-gray-400 border-l border-gray-300 pl-2 ml-1 italic max-w-[150px] truncate">
                            "{task.completionReason}"
                          </span>
                        )}
                      </div>
                    )}

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
                
                <button 
                  onClick={() => onDelete(task.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors p-1"
                  aria-label="Delete task"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskList;