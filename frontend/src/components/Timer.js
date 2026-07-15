import React, { useEffect, useRef, useState } from 'react';

const Timer = ({ timeLimit, onExpire }) => {
  const safeLimit = Number(timeLimit) > 0 ? Number(timeLimit) : 30;
  const [timeLeft, setTimeLeft] = useState(safeLimit);

  const onExpireRef = useRef(onExpire);
  const expiredRef = useRef(false);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setTimeLeft(safeLimit);
    expiredRef.current = false;
  }, [safeLimit]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current();
      }
      return;
    }

    const id = setTimeout(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);

    return () => clearTimeout(id);
  }, [timeLeft]);

  const pct = Math.max(0, Math.min(1, timeLeft / safeLimit));
  const color = pct > 0.5 ? '#22c55e' : pct > 0.25 ? '#f59e0b' : '#ef4444';
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - pct);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.25rem',
    }}>
      <svg width="60" height="60">
        <circle
          cx="30"
          cy="30"
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth="4"
        />

        <g transform="rotate(-90 30 30)">
          <circle
            cx="30"
            cy="30"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
          />
        </g>

        <text
          x="30"
          y="35"
          textAnchor="middle"
          fill="var(--text)"
          fontSize="13"
          fontWeight="700"
        >
          {timeLeft}
        </text>
      </svg>

      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)' }}>
        {timeLeft}s left
      </span>
    </div>
  );
};

export default Timer;