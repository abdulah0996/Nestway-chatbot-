import React, { useEffect, useState } from 'react';

export default function AnimatedCounter({ value, duration = 1200, prefix = '', suffix = '' }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Extract numeric part if string has characters (e.g. '98.4%')
    const numericTarget = typeof value === 'number' 
      ? value 
      : parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;

    let start = 0;
    const startTime = performance.now();

    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quad
      const easeProgress = 1 - (1 - progress) * (1 - progress);
      const current = Math.round(start + (numericTarget - start) * easeProgress);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        setDisplayValue(numericTarget);
      }
    };

    requestAnimationFrame(update);
  }, [value, duration]);

  // Format with commas if >= 1000
  const formatted = displayValue >= 1000 
    ? displayValue.toLocaleString() 
    : displayValue;

  return (
    <span className="tabular-nums">
      {prefix}{formatted}{suffix}
    </span>
  );
}
