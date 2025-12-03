import React from 'react';
import { DailyRecord } from '../types';
import { CalendarDays, Trophy, Clock, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import SummaryTable from './SummaryTable';

interface HistoryViewProps {
  history: DailyRecord[];
  onBack: () => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ history, onBack }) => {
  const [expandedDate, setExpandedDate] = React.useState<string | null>(null);

  const toggleExpand = (date: string) => {
    setExpandedDate(expandedDate === date ? null : date);
  };

  // Sort by timestamp if available, otherwise fallback to date string comparison
  const sortedHistory = [...history].sort((a, b) => {
    const timeA = a.timestamp || new Date(a.date).getTime();
    const timeB = b.timestamp || new Date(b.date).getTime();
    return timeB - timeA;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-6 px-4">
      <header className="mb-8 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="text-indigo-600 font-medium hover:bg-indigo-50 px-3 py-1 rounded-lg transition-colors"
        >
          ← 返回今日计划
        </button>
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
           <CalendarDays className="text-indigo-600" />
           历史战绩
        </h1>
        <div className="w-20"></div> {/* Spacer for centering */}
      </header>

      {sortedHistory.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Trophy size={48} className="mx-auto mb-4 text-gray-300" />
          <p>还没有历史记录哦，完成今天的任务后再来吧！</p>
        </div>
      ) : (
        <div className="space-y-4 max-w-3xl mx-auto">
          {sortedHistory.map((record) => {
            const isExpanded = expandedDate === record.date;
            const diff = record.totalActual - record.totalEstimated;
            
            return (
              <div key={record.date} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div 
                  onClick={() => toggleExpand(record.date)}
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-100 text-indigo-700 font-bold px-3 py-2 rounded-lg text-sm text-center min-w-[60px]">
                      <div>{new Date(record.date).getDate()}日</div>
                      <div className="text-xs font-normal">{new Date(record.date).getMonth() + 1}月</div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800 flex items-center gap-2">
                        完成 {record.completedCount} 项任务
                        {diff < 0 && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">效率爆表</span>}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1"><Clock size={12}/> 实际用时 {record.totalActual}min</span>
                        <span className={`${diff > 0 ? 'text-red-500' : 'text-green-600'}`}>
                           {diff > 0 ? `+${diff}` : diff}min
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-gray-400">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4 animate-in slide-in-from-top-2">
                    {/* AI Summary Section */}
                    {record.aiSummary && (
                      <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100">
                        <div className="flex items-center gap-2 mb-2 text-indigo-800 font-semibold text-sm uppercase tracking-wide">
                          <Sparkles size={16} />
                          AI 每日总结
                        </div>
                        <p className="text-indigo-900 text-sm leading-relaxed">
                          {record.aiSummary}
                        </p>
                      </div>
                    )}
                    
                    <SummaryTable tasks={record.tasks} simpleMode={true} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistoryView;