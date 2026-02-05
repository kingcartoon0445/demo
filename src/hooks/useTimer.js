import { useRef, useEffect } from "react";

export const useTimer = ({ onTick, initialDuration = 0 }) => {
  const timerRef = useRef(null);
  const durationRef = useRef(initialDuration);

  const startTimer = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      durationRef.current += 1;
      onTick();
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const resetTimer = () => {
    stopTimer();
    durationRef.current = 0;
  };

  // Cleanup timer khi component unmount
  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, []);

  return {
    startTimer,
    stopTimer,
    resetTimer,
    getDuration: () => durationRef.current,
  };
};
