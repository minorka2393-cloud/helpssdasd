import React, { useState } from 'react';
import { Task, TaskStatus, Language, Theme } from '../types';
import { Plus, Trash2, CheckCircle2, Circle, Clock, Globe, BookOpen, Sun, Moon } from 'lucide-react';
import { Button } from './Button';

interface TaskControlProps {
  tasks: Task[];
  addTask: (title: string) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  deleteTask: (id: string) => void;
  currentTaskId: string | null;
  selectTask: (id: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const TaskControl: React.FC<TaskControlProps> = ({
  tasks,
  addTask,
  updateTaskStatus,
  deleteTask,
  currentTaskId,
  selectTask,
  language,
  setLanguage,
  theme,
  setTheme
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      addTask(newTaskTitle.trim());
      setNewTaskTitle('');
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="flex flex-col h-full w-full md:w-[320px] bg-white/80 dark:bg-slate-900/85 backdrop-blur-xl border-r border-white/20 dark:border-slate-700/50 shadow-2xl md:rounded-l-2xl overflow-hidden relative z-20 transition-colors duration-300">
      {/* Header */}
      <div className="p-5 border-b border-slate-100/50 dark:border-slate-700/50 bg-gradient-to-b from-white/50 to-transparent dark:from-slate-800/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 bg-indigo-500/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 group-hover:bg-indigo-500/20 transition-all duration-700"></div>
        
        <div className="flex items-center gap-3 mb-1 relative z-10">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 overflow-hidden relative group-hover:scale-105 transition-transform duration-300">
             <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-indigo-700 z-0">
                <BookOpen size={24} className="text-white drop-shadow-sm" />
             </div>
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-600 dark:from-indigo-400 dark:to-purple-300">
            Helper-Kust
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium ml-14 relative z-10">AI Study Assistant</p>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
        <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 py-2 flex items-center gap-2">
          {language === 'ru' ? "Мои Задачи" : "My Tasks"}
          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full">{tasks.length}</span>
        </h3>
        
        {tasks.length === 0 ? (
          <div className="text-center py-12 px-4 flex flex-col items-center animate-fade-in-scale">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3 border border-slate-100 dark:border-slate-700 animate-float">
              <BookOpen className="w-6 h-6 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-medium text-sm">
              {language === 'ru' ? "Список пуст" : "No active tasks"}
            </p>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 max-w-[200px]">
              {language === 'ru' ? "Создайте новую задачу, чтобы начать обучение." : "Create a task to start your learning session."}
            </p>
          </div>
        ) : (
          tasks.map((task, index) => (
            <div
              key={task.id}
              onClick={() => selectTask(task.id)}
              style={{ animationDelay: `${index * 50}ms` }}
              className={`group relative flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer animate-slide-up ${
                currentTaskId === task.id
                  ? 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-500/30 shadow-md shadow-indigo-100 dark:shadow-none ring-1 ring-indigo-50 dark:ring-indigo-500/20 translate-x-1'
                  : 'bg-white/40 dark:bg-slate-800/30 border-transparent hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm hover:border-slate-100 dark:hover:border-slate-700 hover:translate-x-1'
              }`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const nextStatus = task.status === TaskStatus.COMPLETED 
                    ? TaskStatus.PENDING 
                    : TaskStatus.COMPLETED;
                  updateTaskStatus(task.id, nextStatus);
                }}
                className={`mt-0.5 transition-all duration-300 hover:scale-110 ${
                  task.status === TaskStatus.COMPLETED ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400'
                }`}
              >
                {task.status === TaskStatus.COMPLETED ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </button>
              
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate transition-all duration-300 ${
                  task.status === TaskStatus.COMPLETED ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-200'
                }`}>
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border transition-colors ${
                    task.status === TaskStatus.COMPLETED ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/30' :
                    task.status === TaskStatus.IN_PROGRESS ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/30' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}>
                    {task.status === TaskStatus.PENDING ? 'To Do' : task.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTask(task.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all absolute right-2 top-2 hover:rotate-12"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer Area */}
      <div className="p-4 bg-white/60 dark:bg-slate-900/60 border-t border-slate-100/50 dark:border-slate-700/50 backdrop-blur-md z-20">
        
        {/* Add Task Input */}
        <form onSubmit={handleAdd} className="relative mb-4 group">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder={language === 'ru' ? "Новая задача..." : "New task..."}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-10 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/50 transition-all outline-none"
          />
          <button 
            type="submit"
            className="absolute right-1.5 top-1.5 p-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            disabled={!newTaskTitle.trim()}
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>

        {/* Language & Theme Selector */}
        <div className="flex items-center justify-between">
            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 gap-1 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                <Globe className="w-3.5 h-3.5" />
                <select 
                    value={language} 
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    className="bg-transparent font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                    <option value="en" className="dark:bg-slate-800">English</option>
                    <option value="ru" className="dark:bg-slate-800">Русский</option>
                    <option value="es" className="dark:bg-slate-800">Español</option>
                </select>
            </div>

            <button 
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all hover:rotate-12"
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
        </div>
      </div>
    </div>
  );
};