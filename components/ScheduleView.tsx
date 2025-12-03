import React from 'react';
import { ScheduleItem } from '../types';
import { Coffee, CheckCircle2, Circle, Lock } from 'lucide-react';

interface ScheduleViewProps {
  schedule: ScheduleItem[];
}

const ScheduleView: React.FC<ScheduleViewProps> = ({ schedule }) => {
  if (schedule.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        📅 智能计划表
        <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">同步任务清单状态</span>
      </h3>
      
      <div className="relative border-l-2 border-indigo-100 ml-3 space-y-6 py-2">
        {schedule.map((item, index) => {
          const isFinished = item.completed;
          
          return (
            <div key={item.id} className="relative pl-6">
              {/* Timeline Dot */}
              <div 
                className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 transition-colors ${
                  item.isBreak 
                    ? 'bg-green-100 border-green-400' 
                    : isFinished 
                      ? 'bg-indigo-600 border-indigo-600' 
                      : 'bg-white border-indigo-400'
                }`}
              ></div>

              <div className={`transition-all duration-300 ${isFinished ? 'opacity-60 grayscale' : ''}`}>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1 font-mono">
                  <span>{item.startTime}</span>
                  <span>-</span>
                  <span>{item.endTime}</span>
                </div>

                <div 
                  className={`p-3 rounded-lg border flex items-center justify-between group cursor-default ${
                    item.isBreak 
                      ? 'bg-green-50 border-green-100 text-green-800' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.isBreak ? <Coffee size={18} /> : (
                      <div className={`transition-colors ${isFinished ? 'text-indigo-600' : 'text-gray-300'}`}>
                         {isFinished ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-sm md:text-base">
                        {item.name}
                      </div>
                      {!item.isBreak && item.subject && (
                        <div className="text-xs text-gray-500 mt-0.5">{item.subject}</div>
                      )}
                    </div>
                  </div>
                  
                  {!item.isBreak && !isFinished && (
                      <div className="text-gray-300">
                          <Lock size={14} />
                      </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <p className="text-center text-xs text-gray-400 mt-4">
        请在上方「任务清单」中点击任务进行打卡，进度将自动同步至此
      </p>
    </div>
  );
};

export default ScheduleView;