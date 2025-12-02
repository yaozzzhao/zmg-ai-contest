import React, { useState } from 'react';
import { Task } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Star, Clock, Calendar } from 'lucide-react';

interface TaskFormProps {
  onAddTask: (task: Task) => void;
}

const SUBJECTS = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治', '其他'];

const TaskForm: React.FC<TaskFormProps> = ({ onAddTask }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Form State
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [name, setName] = useState('');
  const [importance, setImportance] = useState(3);
  const [difficulty, setDifficulty] = useState(3);
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  
  // Default deadline: Today at 22:00
  const defaultDeadline = new Date();
  defaultDeadline.setHours(22, 0, 0, 0);
  // Handle timezone offset for input type="datetime-local"
  const tzOffset = defaultDeadline.getTimezoneOffset() * 60000;
  const localISOTime = new Date(defaultDeadline.getTime() - tzOffset).toISOString().slice(0, 16);
  
  const [deadline, setDeadline] = useState(localISOTime);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTask: Task = {
      id: uuidv4(),
      subject,
      name,
      importance,
      difficulty,
      deadline: new Date(deadline).toISOString(),
      estimatedMinutes,
      completed: false,
      createdAt: Date.now()
    };
    onAddTask(newTask);
    
    // Reset essential fields
    setName('');
    setImportance(3);
    setDifficulty(3);
    setEstimatedMinutes(30);
    setIsOpen(false);
  };

  const renderStars = (value: number, setter: (val: number) => void, colorClass: string) => (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setter(star)}
          className={`focus:outline-none transition-transform active:scale-95 ${star <= value ? colorClass : 'text-gray-300'}`}
        >
          <Star size={20} fill={star <= value ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-full p-4 flex items-center justify-center space-x-2 text-indigo-600 font-medium hover:bg-indigo-50 transition-colors"
        >
          <Plus size={20} />
          <span>添加新作业</span>
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-gray-700">录入新作业</h3>
            <button 
              type="button" 
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              取消
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subject & Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">科目</label>
              <select 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-gray-50"
              >
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">作业内容</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：课本P20练习题"
                required
                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Ratings */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">重要性 (1-5)</label>
              {renderStars(importance, setImportance, 'text-amber-400')}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">难度 (1-5)</label>
              {renderStars(difficulty, setDifficulty, 'text-red-400')}
            </div>

            {/* Time & Deadline */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Clock size={14} /> 预计用时 (分钟)
              </label>
              <input 
                type="number" 
                min="5" 
                step="5"
                value={estimatedMinutes} 
                onChange={(e) => setEstimatedMinutes(parseInt(e.target.value))}
                className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Calendar size={14} /> 截止时间
              </label>
              <input 
                type="datetime-local" 
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors shadow-sm"
          >
            确认添加
          </button>
        </form>
      )}
    </div>
  );
};

export default TaskForm;
