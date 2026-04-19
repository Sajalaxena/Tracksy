import { useState, useEffect } from 'react';

/**
 * Custom hook to detect streak milestones and trigger celebrations
 * Celebrates every 5 days: 5, 10, 15, 20, 25, 30, etc.
 */
export function useStreakCelebration(habits) {
  const [celebration, setCelebration] = useState(null);

  useEffect(() => {
    if (!habits || habits.length === 0) return;

    // Calculate current streak for each habit
    const today = new Date().getDate();
    
    habits.forEach((habit) => {
      const data = habit.data || {};
      let streak = 0;

      // Count consecutive days from today backwards
      for (let day = today; day >= 1; day--) {
        const value = data[String(day)];
        if (value !== null && value !== undefined && value !== false) {
          streak++;
        } else {
          break;
        }
      }

      // Check if this is a milestone (every 5 days)
      if (streak > 0 && streak % 5 === 0) {
        // Check if we've already celebrated this milestone
        const celebrationKey = `celebrated_${habit._id}_${streak}`;
        const alreadyCelebrated = localStorage.getItem(celebrationKey);

        if (!alreadyCelebrated) {
          // Trigger celebration
          setCelebration({
            streak,
            habitName: habit.name,
            habitId: habit._id,
          });

          // Mark as celebrated
          localStorage.setItem(celebrationKey, 'true');
        }
      }
    });
  }, [habits]);

  const closeCelebration = () => {
    setCelebration(null);
  };

  return { celebration, closeCelebration };
}
