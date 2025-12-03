import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, CheckCircle, Coffee, BrainCircuit, SkipForward, RefreshCw } from 'lucide-react';
import { Task } from '../types';

interface FocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (taskId: string, totalMinutes: number) => void;
  task: Task | null;
}

type TimerMode = 'FOCUS' | 'BREAK';

const FOCUS_DURATION = 25 * 60; // 25 minutes
const BREAK_DURATION = 5 * 60;  // 5 minutes

const FocusModal: React.FC<FocusModalProps> = ({ isOpen, onClose, onComplete, task }) => {
  const [mode, setMode] = useState<TimerMode>('FOCUS');
  const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION);
  const [isActive, setIsActive] = useState(false);
  
  // Track total actual work time (excluding breaks) in seconds
  const [totalWorkSeconds, setTotalWorkSeconds] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio for timer end (simple beep)
  const playNotification = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(mode === 'FOCUS' ? 880 : 500, audioContext.currentTime); // High pitch for break, lower for focus
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Reset state when opening
      setMode('FOCUS');
      setTimeLeft(FOCUS_DURATION);
      setIsActive(false);
      setTotalWorkSeconds(0);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen, task]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
        
        // Only count towards total work if in FOCUS mode
        if (mode === 'FOCUS') {
          setTotalWorkSeconds((prev) => prev + 1);
        }
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      // Timer finished
      if (timerRef.current) clearInterval(timerRef.current);
      setIsActive(false);
      playNotification();
      
      // Auto-switch suggestion logic could go here, for now strictly manual or simple toggle
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => setIsActive(!isActive);

  const handleFinishEarly = () => {
    if (!task) return;
    const minutes = Math.ceil(totalWorkSeconds / 60);
    // Ensure at least 1 minute is recorded if they started
    const finalMinutes = minutes === 0 && totalWorkSeconds > 0 ? 1 : minutes;
    onComplete(task.id, finalMinutes);
  };

  const switchMode = () => {
    setIsActive(false);
    if (mode === 'FOCUS') {
      setMode('BREAK');
      setTimeLeft(BREAK_DURATION);
    } else {
      setMode('FOCUS');
      setTimeLeft(FOCUS_DURATION);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = mode === 'FOCUS' 
    ? ((FOCUS_DURATION - timeLeft) / FOCUS_DURATION) * 100 
    : ((BREAK_DURATION - timeLeft) / BREAK_DURATION) * 100;

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-90 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md p-6 relative">
        {/* Close Button (Cancel) */}
        <button 
          onClick={onClose}
          className="absolute top-0 right-0 p-2 text-gray-400 hover:text-white transition-colors"
        >
          <X size={32} />
        </button>

        <div className="flex flex-col items-center text-white">
          {/* Header Info */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
              {mode === 'FOCUS' ? <BrainCircuit className="text-indigo-400" /> : <Coffee className="text-green-400" />}
              {mode === 'FOCUS' ? '专注模式' : '休息时间'}
            </h2>
            <p className="text-gray-400 text-lg">{task.name}</p>
            <div className="mt-2 text-sm bg-gray-800 px-3 py-1 rounded-full inline-block">
               累计专注: {Math.floor(totalWorkSeconds / 60)} 分 {totalWorkSeconds % 60} 秒
            </div>
          </div>

          {/* Timer Circle */}
          <div className="relative w-64 h-64 flex items-center justify-center mb-10">
            {/* Background Circle */}
            <svg className="absolute w-full h-full transform -rotate-90">
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-800"
              />
              {/* Progress Circle */}
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 120}
                strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
                className={`transition-all duration-1000 ease-linear ${
                  mode === 'FOCUS' ? 'text-indigo-500' : 'text-green-500'
                }`}
              />
            </svg>
            
            <div className="text-6xl font-mono font-bold tracking-wider z-10">
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6 mb-8">
            <button
              onClick={toggleTimer}
              className={`p-6 rounded-full transition-all active:scale-95 shadow-lg flex items-center justify-center ${
                isActive 
                  ? 'bg-gray-800 text-white border border-gray-700 hover:bg-gray-700' 
                  : 'bg-white text-gray-900 hover:bg-gray-100'
              }`}
            >
              {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
            </button>
          </div>

          {/* Mode Switching & Finish */}
          <div className="w-full grid grid-cols-2 gap-4">
            <button
              onClick={switchMode}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
            >
              {timeLeft === 0 ? (
                <>
                   <RefreshCw size={18} />
                   {mode === 'FOCUS' ? '开始休息' : '开始专注'}
                </>
              ) : (
                <>
                   <SkipForward size={18} />
                   {mode === 'FOCUS' ? '跳过专注' : '跳过休息'}
                </>
              )}
            </button>

            <button
              onClick={handleFinishEarly}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors shadow-lg shadow-indigo-900/50"
            >
              <CheckCircle size={18} />
              完成任务
            </button>
          </div>
          
          {timeLeft === 0 && (
             <p className="mt-4 text-center animate-bounce text-yellow-400 font-medium">
                ⏰ 计时结束！{mode === 'FOCUS' ? '休息一下吧~' : '该回来学习啦！'}
             </p>
          )}

        </div>
      </div>
    </div>
  );
};

export default FocusModal;