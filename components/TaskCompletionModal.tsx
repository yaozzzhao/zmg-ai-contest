import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { Clock, CheckCircle2, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
  onConfirm: (actualMinutes: number, reason: string) => void;
}

const TaskCompletionModal: React.FC<Props> = ({ isOpen, task, onClose, onConfirm }) => {
  const [actualMinutes, setActualMinutes] = useState(0);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (task) {
      setActualMinutes(task.estimatedMinutes);
      setReason('');
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const diff = actualMinutes - task.estimatedMinutes;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(actualMinutes, reason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-between items-start mb-4">
             <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
               🎉 完成任务
             </h3>
             <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
               <X size={20}/>
             </button>
          </div>
          
          <div className="mb-6 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
            <div className="text-xs text-indigo-500 uppercase font-semibold mb-1">{task.subject}</div>
            <div className="font-bold text-indigo-900 text-lg leading-tight">{task.name}</div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Clock size={16} /> 实际用时 (分钟)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                value={actualMinutes}
                onChange={(e) => setActualMinutes(parseInt(e.target.value) || 0)}
                className="w-24 p-2 border border-gray-300 rounded-lg text-center font-bold text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                autoFocus
              />
              <div className="text-sm">
                <div className="text-gray-500 text-xs mb-0.5">预计: {task.estimatedMinutes} min</div>
                <div className={`font-medium ${diff < 0 ? 'text-green-600' : diff > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                  {diff === 0 ? "⏱ 准时完成" : diff < 0 ? `⚡️ 提前 ${Math.abs(diff)} 分钟` : `🐢 延后 ${diff} 分钟`}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
               原因 / 备注 (可选)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={diff < 0 ? "如：题目比想象简单" : diff > 0 ? "如：查资料花了时间" : "记录一下心情..."}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-colors flex justify-center items-center gap-2 shadow-md hover:shadow-lg transform active:scale-95 duration-150"
          >
            <CheckCircle2 size={20} /> 确认打钩
          </button>
        </form>
      </div>
    </div>
  );
};

export default TaskCompletionModal;