import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

/**
 * StreakCelebration Component
 * Shows a celebration modal with confetti when user reaches streak milestones
 * Milestones: 5, 10, 15, 20, 25, 30, etc. (every 5 days)
 */
export default function StreakCelebration({ streak, habitName, onClose }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (!show) return;

    // Fire confetti multiple times for dramatic effect
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      // Fire from left side
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });

      // Fire from right side
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    // Cleanup
    return () => clearInterval(interval);
  }, [show]);

  const handleClose = () => {
    setShow(false);
    onClose?.();
  };

  if (!show) return null;

  // Get milestone message
  const getMilestoneMessage = () => {
    if (streak >= 100) return "LEGENDARY! 💯";
    if (streak >= 50) return "UNSTOPPABLE! 🚀";
    if (streak >= 30) return "AMAZING! 🌟";
    if (streak >= 20) return "INCREDIBLE! 🎯";
    if (streak >= 10) return "FANTASTIC! 🔥";
    return "AWESOME! 🎉";
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 max-w-md mx-4 animate-scale-in">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="text-center">
          {/* Trophy animation */}
          <div className="mb-6 animate-bounce-slow">
            <div className="text-8xl mb-2">🏆</div>
          </div>

          {/* Milestone message */}
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 mb-2">
            {getMilestoneMessage()}
          </h2>

          {/* Streak info */}
          <div className="mb-6">
            <div className="text-6xl font-black text-gray-900 dark:text-white mb-2">
              {streak}
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
              Day Streak! 🔥
            </p>
          </div>

          {/* Habit name */}
          <div className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 rounded-2xl p-4 mb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">You're crushing it with</p>
            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{habitName}</p>
          </div>

          {/* Motivational message */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Keep going! Consistency is the key to success. 💪
          </p>

          {/* Continue button */}
          <button
            onClick={handleClose}
            className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 transition-all shadow-lg hover:shadow-xl active:scale-95"
          >
            Continue Tracking
          </button>
        </div>
      </div>
    </div>
  );
}
