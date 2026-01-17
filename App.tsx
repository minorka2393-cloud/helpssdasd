import React, { useState, useEffect } from 'react';
import { TaskControl } from './components/TaskControl';
import { Workspace } from './components/Workspace';
import { Task, TaskStatus, Language } from './types';
import { Menu, X, Sparkles } from 'lucide-react';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [language, setLanguage] = useState<Language>('ru'); // Defaulting to Russian per user preference "MUST NECESSARILY CONTAIN RUSSIAN"

  // Responsive sidebar check
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile((window as any).innerWidth < 768);
      if ((window as any).innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    checkMobile();
    (window as any).addEventListener('resize', checkMobile);
    return () => (window as any).removeEventListener('resize', checkMobile);
  }, []);

  const addTask = (title: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      status: TaskStatus.PENDING,
      createdAt: Date.now(),
    };
    setTasks(prev => [newTask, ...prev]);
    setActiveTaskId(newTask.id);
    if (isMobile) setIsSidebarOpen(false);
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
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Task Control */}
      <div className={`fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-full flex flex-col w-80 shadow-2xl md:shadow-none">
            {/* Branding in Sidebar */}
            <div className="h-16 flex items-center px-6 bg-indigo-700 text-white shrink-0">
                <Sparkles className="w-6 h-6 mr-2 text-indigo-200" />
                <h1 className="text-xl font-bold tracking-tight">Helper-Kust</h1>
            </div>
            <TaskControl 
                tasks={tasks}
                addTask={addTask}
                updateTaskStatus={updateTaskStatus}
                deleteTask={deleteTask}
                currentTaskId={activeTaskId}
                selectTask={(id) => {
                    setActiveTaskId(id);
                    if (isMobile) setIsSidebarOpen(false);
                }}
                language={language}
                setLanguage={setLanguage}
            />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Mobile Header */}
        <div className="h-16 border-b border-slate-200 bg-white flex items-center px-4 md:hidden shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="ml-3 font-semibold text-slate-800">Helper-Kust</span>
        </div>

        <Workspace 
          activeTask={activeTask}
          onUpdateStatus={(status) => activeTaskId && updateTaskStatus(activeTaskId, status)}
          language={language}
        />
      </div>
    </div>
  );
}
