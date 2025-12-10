import React, { createContext, useContext, useState, useEffect } from 'react';

// Define available themes
const THEMES = {
  default: {
    name: 'Default',
    primary: '#2e8555',
    secondary: '#267265',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1f2937',
    textSecondary: '#6b7280'
  },
  dark: {
    name: 'Dark',
    primary: '#4ade80',
    secondary: '#22c55e',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f1f5f9',
    textSecondary: '#94a3b8'
  },
  blue: {
    name: 'Ocean',
    primary: '#3b82f6',
    secondary: '#2563eb',
    background: '#f0f9ff',
    surface: '#e0f2fe',
    text: '#1e3a8a',
    textSecondary: '#3730a3'
  },
  green: {
    name: 'Forest',
    primary: '#16a34a',
    secondary: '#15803d',
    background: '#f0fdf4',
    surface: '#dcfce7',
    text: '#14532d',
    textSecondary: '#166534'
  },
  purple: {
    name: 'Purple',
    primary: '#a855f7',
    secondary: '#9333ea',
    background: '#fdf4ff',
    surface: '#fae8ff',
    text: '#581c87',
    textSecondary: '#6b21a8'
  }
};

// Create theme context
const ThemeContext = createContext();

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('default');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load theme from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('userTheme') || 'default';
    const savedDarkMode = localStorage.getItem('userDarkMode') === 'true';

    setTheme(savedTheme);
    setIsDarkMode(savedDarkMode);
  }, []);

  // Apply theme changes to the document
  useEffect(() => {
    const currentTheme = THEMES[theme] || THEMES.default;

    // Apply CSS variables for the theme
    document.documentElement.style.setProperty('--primary-color', currentTheme.primary);
    document.documentElement.style.setProperty('--secondary-color', currentTheme.secondary);
    document.documentElement.style.setProperty('--background-color', currentTheme.background);
    document.documentElement.style.setProperty('--surface-color', currentTheme.surface);
    document.documentElement.style.setProperty('--text-color', currentTheme.text);
    document.documentElement.style.setProperty('--text-secondary-color', currentTheme.textSecondary);

    // Apply dark mode class if needed
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Save to localStorage
    localStorage.setItem('userTheme', theme);
    localStorage.setItem('userDarkMode', isDarkMode);
  }, [theme, isDarkMode]);

  // Function to change theme
  const changeTheme = (newTheme) => {
    if (THEMES[newTheme]) {
      setTheme(newTheme);
    }
  };

  // Function to toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Function to set dark mode explicitly
  const setDarkMode = (darkMode) => {
    setIsDarkMode(darkMode);
  };

  // Get theme info
  const getThemeInfo = (themeName) => {
    return THEMES[themeName] || THEMES.default;
  };

  const value = {
    theme,
    isDarkMode,
    availableThemes: THEMES,
    changeTheme,
    toggleDarkMode,
    setDarkMode,
    getThemeInfo
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme selector component
export const ThemeSelector = ({ className = '' }) => {
  const { theme, changeTheme, availableThemes, isDarkMode, toggleDarkMode } = useTheme();

  return (
    <div className={`flex flex-col space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Dark Mode</span>
        <button
          onClick={toggleDarkMode}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isDarkMode ? 'bg-primary' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isDarkMode ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Select Theme</label>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(availableThemes).map(([key, themeData]) => (
            <button
              key={key}
              onClick={() => changeTheme(key)}
              className={`p-2 rounded-lg border-2 transition-all ${
                theme === key
                  ? 'border-primary ring-2 ring-primary ring-opacity-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              title={themeData.name}
            >
              <div className="flex flex-col items-center">
                <div className="flex space-x-1 mb-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: themeData.primary }}
                  ></div>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: themeData.secondary }}
                  ></div>
                </div>
                <span className="text-xs">{themeData.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Theme-aware component for displaying theme info
export const ThemePreview = () => {
  const { theme, getThemeInfo } = useTheme();
  const themeData = getThemeInfo(theme);

  return (
    <div className="p-4 rounded-lg border bg-surface">
      <h4 className="font-medium mb-2">Current Theme: {themeData.name}</h4>
      <div className="flex items-center space-x-2">
        <div
          className="w-6 h-6 rounded-full border"
          style={{ backgroundColor: themeData.primary }}
        ></div>
        <span className="text-sm">Primary: {themeData.primary}</span>
      </div>
      <div className="flex items-center space-x-2 mt-1">
        <div
          className="w-6 h-6 rounded-full border"
          style={{ backgroundColor: themeData.background }}
        ></div>
        <span className="text-sm">Background: {themeData.background}</span>
      </div>
    </div>
  );
};

export default ThemeContext;