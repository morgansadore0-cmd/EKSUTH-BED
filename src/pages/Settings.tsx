import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun, Monitor } from 'lucide-react';
import { clsx } from 'clsx';

export default function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="p-6">
          <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Appearance</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-white">Theme Preference</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Select your preferred interface theme.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-lg mt-4">
              <button
                onClick={() => setTheme('light')}
                className={clsx(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors",
                  theme === 'light' 
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" 
                    : "border-slate-200 dark:border-slate-700 hover:border-emerald-300 text-slate-600 dark:text-slate-400"
                )}
              >
                <Sun className="w-6 h-6" />
                <span className="text-sm font-medium">Light</span>
              </button>

              <button
                onClick={() => setTheme('dark')}
                className={clsx(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors",
                  theme === 'dark' 
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" 
                    : "border-slate-200 dark:border-slate-700 hover:border-emerald-300 text-slate-600 dark:text-slate-400"
                )}
              >
                <Moon className="w-6 h-6" />
                <span className="text-sm font-medium">Dark</span>
              </button>

              <button
                onClick={() => setTheme('system')}
                className={clsx(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors",
                  theme === 'system' 
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" 
                    : "border-slate-200 dark:border-slate-700 hover:border-emerald-300 text-slate-600 dark:text-slate-400"
                )}
              >
                <Monitor className="w-6 h-6" />
                <span className="text-sm font-medium">System</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
