import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';

interface ReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feeling: string) => void;
  aiAdvice: string | null;
  loading: boolean;
}

const ReflectionModal: React.FC<ReflectionModalProps> = ({ isOpen, onClose, onSubmit, aiAdvice, loading }) => {
  const [feeling, setFeeling] = useState<string>('刚好');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Sparkles className="text-yellow-400" /> 
              今日任务达成！
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          {!aiAdvice ? (
            <>
              <p className="text-gray-600 mb-6">太棒了，你完成了今天所有的计划！回顾一下，你觉得今天的计划安排得怎么样？</p>
              
              <div className="space-y-3 mb-6">
                {['太轻松了', '刚好', '有点累/太多'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setFeeling(opt)}
                    className={`w-full p-3 rounded-lg border text-left transition-all ${
                      feeling === opt 
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-medium ring-1 ring-indigo-500' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              <button
                onClick={() => onSubmit(feeling)}
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {loading ? (
                   <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    生成建议中...
                   </>
                ) : '提交并获取 AI 建议'}
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <h4 className="font-semibold text-indigo-800 mb-2">AI 教练建议：</h4>
                <p className="text-indigo-900 leading-relaxed text-sm">
                  {aiAdvice}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200"
              >
                关闭
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReflectionModal;
