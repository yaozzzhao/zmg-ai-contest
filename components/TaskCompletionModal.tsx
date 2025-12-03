import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { X, Clock, MessageSquare, CheckCircle } from 'lucide-react';

interface TaskCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (taskId: string, actualMinutes: number, reason: string) => void;
  task: Task | null;
}

const TaskCompletionModal: React.FC<TaskCompletionModalProps> = ({ isOpen, onClose, onConfirm, task }) => {
  const [actualMinutes, setActualMinutes] = useState<number>(30);
  const [reason, setReason] = useState<string>('');

  useEffect(() => {
    if (task) {
      setActualMinutes(task.estimatedMinutes);
      setReason('');
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const timeDiff = actualMinutes - task.estimatedMinutes;
  
  let diffText = '';
  let diffColor = '';

  if (timeDiff === 0) {
    diffText = '完美！按计划完成';
    diffColor = 'text-green-600';
  } else if (timeDiff < 0) {
    diffText = `太棒了！提前 ${Math.abs(timeDiff)} 分钟完成`;
    diffColor = 'text-indigo-600';
  } else {
    diffText = `比预计慢了 ${timeDiff} 分钟`;
    diffColor = 'text-amber-600';
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(task.id, actualMinutes, reason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <CheckCircle className="text-indigo-200" />
            完成任务打卡
          </h3>
          <button onClick={onClose} className="text-indigo-100 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <div className="text-sm text-gray-500 mb-1">任务名称</div>
            <div className="text-xl font-bold text-gray-800">{task.name}</div>
            <div className="text-sm text-indigo-600 mt-1">预计用时: {task.estimatedMinutes} 分钟</div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Clock size={16} />
              实际用时 (分钟)
            </label>
            <input
              type="number"
              min="1"
              value={actualMinutes}
              onChange={(e) => setActualMinutes(parseInt(e.target.value) || 0)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg font-mono"
              required
            />
            <div className={`mt-2 text-sm font-medium ${diffColor}`}>
              {diffText}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <MessageSquare size={16} />
              {timeDiff < 0 ? '提前完成的原因？' : timeDiff > 0 ? '延后的原因？' : '心得备注'}
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={timeDiff < 0 ? "例如：题目比想象简单..." : timeDiff > 0 ? "例如：中间走神了..." : "例如：状态不错..."}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95"
          >
            确认完成
          </button>
        </form>
      </div>
    </div>
  );
};

export default TaskCompletionModal;