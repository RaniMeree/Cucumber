import React from 'react';

const CalorieProgress = ({ consumed, limit, size = 90, showDate, date, dayName, fontSize = 8, dayNameSize = 6 }) => {
  const percentage = (consumed / limit) * 100;

  if (isNaN(percentage)) {
    return (
      <div style={{ 
        width: size, 
        height: size,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontWeight: 'bold' }}>{date}</div>
        <div style={{ fontSize: '0.8em' }}>{dayName}</div>
      </div>
    );
  }

  const radius = size * 0.25; // Reduced from 0.35 to make circle smaller
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const strokeWidth = size * 0.06;

  const getColor = (percentage) => {
    if (percentage <= 70) {
      return '#FFD700'; // Yellow
    } else if (percentage <= 90) {
      return '#FFA500'; // Orange
    } else if (percentage <= 110) {
      return '#34C759'; // Green
    } else {
      return '#FF3B30'; // Red
    }
  };

  const color = getColor(percentage);

  return (
    <div style={{ 
      position: 'relative',
      width: size,
      height: size,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      padding: '4px'
    }}>
      {showDate && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'absolute',
          top: '4px',
          width: '100%',
          textAlign: 'center',
          gap: '2px'
        }}>
          <span style={{
            fontSize: `${size * 0.18}px`,
            fontWeight: 'bold',
            color: '#333',
            lineHeight: '1'
          }}>
            {date}
          </span>
          <span style={{
            fontSize: `${size * 0.16}px`,
            color: '#666',
            lineHeight: '1'
          }}>
            {dayName}
          </span>
        </div>
      )}
      <div style={{
        position: 'relative',
        width: `${size * 0.85}px`,
        height: `${size * 0.85}px`,
        marginTop: `${size * 0.2}px`
      }}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
        >
          {/* Background circle - no stroke */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="#e0e0e0"
            stroke="none"
          />
          {/* Progress circle - no stroke */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill={color}
            stroke="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%',
              transition: 'all 0.5s ease'
            }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <span style={{ 
            fontSize: `${size * 0.15}px`,
            fontWeight: 'bold',
            color: 'white'
          }}>
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default CalorieProgress; 