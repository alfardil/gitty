import { useState, useEffect, useRef, useCallback } from 'react';

// Global timer state that persists across component unmounts
let globalTimerId: NodeJS.Timeout | null = null;
let globalEndDate: Date | null = null;
let globalTimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
let globalSubscribers = new Set<(timeLeft: typeof globalTimeLeft) => void>();

// Initialize global timer if it doesn't exist
if (!globalEndDate) {
  globalEndDate = new Date(Date.now() + (12 * 24 * 60 * 60 * 1000));
  startGlobalTimer();
}

function startGlobalTimer() {
  if (globalTimerId) return; // Already running
  
  const calculateTimeLeft = () => {
    if (!globalEndDate) return;
    
    const now = new Date();
    const difference = globalEndDate.getTime() - now.getTime();

    if (difference > 0) {
      const newTimeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60) % 24)),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
      
      // Only update if values actually changed
      if (globalTimeLeft.days !== newTimeLeft.days || 
          globalTimeLeft.hours !== newTimeLeft.hours || 
          globalTimeLeft.minutes !== newTimeLeft.minutes || 
          globalTimeLeft.seconds !== newTimeLeft.seconds) {
        globalTimeLeft = newTimeLeft;
        // Notify all subscribers
        globalSubscribers.forEach(callback => callback(globalTimeLeft));
      }
    } else {
      // Trial has ended
      if (globalTimeLeft.days !== 0 || globalTimeLeft.hours !== 0 || 
          globalTimeLeft.minutes !== 0 || globalTimeLeft.seconds !== 0) {
        globalTimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
        globalSubscribers.forEach(callback => callback(globalTimeLeft));
      }
    }
  };

  // Calculate immediately
  calculateTimeLeft();
  
  // Set up interval
  globalTimerId = setInterval(calculateTimeLeft, 1000);
}

export function useGlobalCountdown() {
  const [timeLeft, setTimeLeft] = useState(globalTimeLeft);
  const isSubscribed = useRef(false);

  useEffect(() => {
    if (!isSubscribed.current) {
      isSubscribed.current = true;
      globalSubscribers.add(setTimeLeft);
      
      // Set initial value immediately
      setTimeLeft(globalTimeLeft);
    }

    return () => {
      if (isSubscribed.current) {
        isSubscribed.current = false;
        globalSubscribers.delete(setTimeLeft);
      }
    };
  }, []);

  const resetTimer = useCallback(() => {
    // Reset global timer to 12 days from now
    globalEndDate = new Date(Date.now() + (12 * 24 * 60 * 60 * 1000));
    
    // Restart timer if it was stopped
    if (!globalTimerId) {
      startGlobalTimer();
    }
  }, []);

  return { timeLeft, resetTimer };
}
