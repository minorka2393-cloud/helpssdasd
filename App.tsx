import React, { useState, useEffect } from 'react';
import { TaskControl } from './components/TaskControl';
import { Workspace } from './components/Workspace';
import { Task, TaskStatus, Language, Theme } from './types';

const App = () => {
  // Initialize state from local storage or defaults
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('hk_tasks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('ru');
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem('hk_theme') as Theme) || 'light';
    } catch {
      return 'light';
    }
  });

  // Persistence
  useEffect(() => {
    localStorage.setItem('hk_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Theme Persistence & DOM update
  useEffect(() => {
    localStorage.setItem('hk_theme', theme);
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const addTask = (title: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      status: TaskStatus.PENDING,
      createdAt: Date.now(),
    };
    setTasks(prev => [newTask, ...prev]);
    setActiveTaskId(newTask.id); // Auto-select new task, which switches view on mobile
  };

  const updateTaskStatus = (id: string, status: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (activeTaskId === id) setActiveTaskId(null);
  };

  const activeTask = tasks.find(t => t.id === activeTaskId) || null;

  return (
    <div className="flex flex-col md:flex-row h-full w-full max-w-[1600px] mx-auto overflow-hidden md:rounded-2xl md:shadow-2xl md:ring-1 md:ring-white/20 dark:md:ring-slate-700/50">
      {/* 
        Mobile View Logic:
        - If activeTaskId is present: Hide TaskControl (List), Show Workspace
        - If activeTaskId is null: Show TaskControl (List), Hide Workspace
        
        Desktop View Logic:
        - Always show both
      */}
      
      <div className={`${activeTaskId ? 'hidden md:block' : 'block'} h-full w-full md:w-auto`}>
        <TaskControl
          tasks={tasks}
          addTask={addTask}
          updateTaskStatus={updateTaskStatus}
          deleteTask={deleteTask}
          currentTaskId={activeTaskId}
          selectTask={setActiveTaskId}
          language={language}
          setLanguage={setLanguage}
          theme={theme}
          setTheme={setTheme}
        />
      </div>
      
      <div className={`${!activeTaskId ? 'hidden md:block' : 'block'} h-full flex-1`}>
        <Workspace
          activeTask={activeTask}
          onUpdateStatus={(status) => activeTask && updateTaskStatus(activeTask.id, status)}
          language={language}
          onBack={() => setActiveTaskId(null)}
        />
      </div>
    </div>
  );
};

export default App;