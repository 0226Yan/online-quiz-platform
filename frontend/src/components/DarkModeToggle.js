import React from 'react';
import { useTheme } from '../context/ThemeContext';

const DarkModeToggle = () => {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} className="btn-outline">
      {isDark ? 'Light Mode' : 'Dark Mode'}
    </button>
  );
};

export default DarkModeToggle;
