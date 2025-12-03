import React from 'react';
import { DailyRecord } from '../types';
import { CalendarDays, Trophy, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface HistoryViewProps {
  history: DailyRecord[];
  onBack: () => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ history, onBack }) => {
  const [expandedDate, setExpandedDate] = React.useState<string | null>(null);

  const toggleExpand = (date: string) => {
    setExpandedDate(expandedDate === date ? null : date);
  };

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

      {history.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Trophy size={48} className="mx-auto mb-4 text-gray-300" />
          <p>还没有历史记录哦，完成今天的任务后再来吧！</p>
        </div>
      ) : (
        <div className="space-y-4 max-w-2xl mx-auto">
          {history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((record) => {
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
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-500 text-left">
                          <th className="pb-2 font-normal">任务</th>
                          <th className="pb-2 font-normal text-center">实际/预计</th>
                          <th className="pb-2 font-normal text-right">偏差</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {record.tasks.map(t => (
                          <tr key={t.id}>
                            <td className="py-2 text-gray-700">
                                <div className="font-medium">{t.name}</div>
                                <div className="text-xs text-gray-500">{t.completionReason}</div>
                            </td>
                            <td className="py-2 text-center text-gray-600">
                                {t.actualMinutes} / {t.estimatedMinutes}
                            </td>
                            <td className={`py-2 text-right font-medium ${
                                (t.actualMinutes || 0) > t.estimatedMinutes ? 'text-red-500' : 'text-green-600'
                            }`}>
                                {(t.actualMinutes || 0) - t.estimatedMinutes > 0 ? '+' : ''}
                                {(t.actualMinutes || 0) - t.estimatedMinutes}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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