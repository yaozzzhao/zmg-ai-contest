import React from 'react';
import { Task } from '../types';
import { Trophy, Clock, Target, Calendar } from 'lucide-react';

interface SummaryTableProps {
  tasks: Task[];
}

const SummaryTable: React.FC<SummaryTableProps> = ({ tasks }) => {
  const totalEstimated = tasks.reduce((acc, t) => acc + t.estimatedMinutes, 0);
  const totalActual = tasks.reduce((acc, t) => acc + (t.actualMinutes || 0), 0);
  const totalDiff = totalActual - totalEstimated;

  const todayStr = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  return (
    <div className="animate-in slide-in-from-right duration-500 max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-indigo-100">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-center text-white relative overflow-hidden">
           {/* Decorative circles */}
           <div className="absolute top-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-x-10 -translate-y-10"></div>
           <div className="absolute bottom-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full translate-x-10 translate-y-10"></div>

          <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm border border-white/20 shadow-inner">
            <Trophy size={32} className="text-yellow-300" />
          </div>
          <h2 className="text-3xl font-bold mb-2 tracking-tight">今日任务全部通关！</h2>
          <div className="flex items-center justify-center gap-2 text-indigo-100 mb-2 opacity-90">
             <Calendar size={16} />
             <span className="font-medium">{todayStr}</span>
          </div>
          <p className="text-indigo-200 text-sm">你的学习效率分析报告已生成</p>
        </div>

        <div className="grid grid-cols-3 gap-4 p-6 border-b border-gray-100">
          <div className="text-center p-4 bg-indigo-50 rounded-xl">
            <div className="text-gray-500 text-xs uppercase mb-1 font-semibold tracking-wide">预计总用时</div>
            <div className="text-2xl font-bold text-indigo-700">{totalEstimated}<span className="text-sm font-normal text-indigo-400 ml-1">min</span></div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-xl">
            <div className="text-gray-500 text-xs uppercase mb-1 font-semibold tracking-wide">实际总用时</div>
            <div className="text-2xl font-bold text-purple-700">{totalActual}<span className="text-sm font-normal text-purple-400 ml-1">min</span></div>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-xl">
            <div className="text-gray-500 text-xs uppercase mb-1 font-semibold tracking-wide">总偏差</div>
            <div className={`text-2xl font-bold ${totalDiff > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {totalDiff > 0 ? `+${totalDiff}` : totalDiff}<span className="text-sm font-normal ml-1">min</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Target size={20} className="text-indigo-600" />
            任务执行明细
          </h3>
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">科目/任务</th>
                  <th className="py-3 px-2 text-xs font-semibold text-gray-500 text-center uppercase tracking-wider">预计</th>
                  <th className="py-3 px-2 text-xs font-semibold text-gray-500 text-center uppercase tracking-wider">实际</th>
                  <th className="py-3 px-2 text-xs font-semibold text-gray-500 text-center uppercase tracking-wider">偏差</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">完成时间</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">原因/备注</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {tasks.sort((a,b) => (a.completedAt || 0) - (b.completedAt || 0)).map((task) => {
                  const diff = (task.actualMinutes || 0) - task.estimatedMinutes;
                  return (
                    <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-800">{task.name}</div>
                        <div className="text-xs text-indigo-600 bg-indigo-50 inline-block px-1.5 py-0.5 rounded mt-1 font-medium">{task.subject}</div>
                      </td>
                      <td className="py-3 px-2 text-center text-gray-600 font-mono text-sm">{task.estimatedMinutes}</td>
                      <td className="py-3 px-2 text-center font-bold text-gray-800 font-mono text-sm">{task.actualMinutes}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full font-bold font-mono ${
                          diff === 0 ? 'bg-green-100 text-green-700' :
                          diff < 0 ? 'bg-indigo-100 text-indigo-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {diff > 0 ? `+${diff}` : diff}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 font-mono">
                        {task.completedAt ? new Date(task.completedAt).toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit'}) : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 italic">
                        {task.completionReason ? `"${task.completionReason}"` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryTable;