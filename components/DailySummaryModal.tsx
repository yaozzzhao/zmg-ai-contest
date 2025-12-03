import React from 'react';
import { Sparkles, ArrowRight, Save } from 'lucide-react';

interface DailySummaryModalProps {
  isOpen: boolean;
  summary: string;
  onConfirm: () => void;
  isLoading: boolean;
}

const DailySummaryModal: React.FC<DailySummaryModalProps> = ({ isOpen, summary, onConfirm, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 mx-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-x-10 -translate-y-10 animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full translate-x-10 translate-y-10 animate-pulse delay-75"></div>
          
          <Sparkles className="mx-auto mb-3 text-yellow-300 h-10 w-10 animate-spin-slow" />
          <h2 className="text-2xl font-bold tracking-tight">今日任务大满贯！</h2>
          <p className="text-indigo-100 mt-1">AI 教练为你生成了今日总结</p>
        </div>

        {/* Content */}
        <div className="p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-gray-500 animate-pulse">正在分析今日战绩...</p>
            </div>
          ) : (
            <>
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 mb-8 relative">
                <div className="absolute -top-3 left-4 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded shadow-sm">
                  AI 建议
                </div>
                <p className="text-indigo-900 leading-relaxed text-lg font-medium">
                  {summary}
                </p>
              </div>

              <button
                onClick={onConfirm}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 group"
              >
                <Save size={20} className="text-gray-400 group-hover:text-white transition-colors" />
                <span>归档并开启新的一天</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailySummaryModal;