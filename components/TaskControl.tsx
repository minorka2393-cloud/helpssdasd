import React, { useState } from 'react';
import { Task, TaskStatus, Language } from '../types';
import { Plus, Trash2, CheckCircle, Circle, Clock, CheckCircle2, Globe } from 'lucide-react';
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
}

export const TaskControl: React.FC<TaskControlProps> = ({
  tasks,
  addTask,
  updateTaskStatus,
  deleteTask,
  currentTaskId,
  selectTask,
  language,
  setLanguage
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      addTask(newTaskTitle.trim());
      setNewTaskTitle('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-full md:w-80 flex-shrink-0">
      <div className="p-4 border-b border-slate-100 bg-slate-50">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-indigo-600" />
          Task Control
        </h2>
        <p className="text-xs text-slate-500 mt-1">Manage homework & to-dos</p>
      </div>

      {/* Language Selector */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-lg">
           <Globe className="w-4 h-4 text-slate-500" />
           <select 
             value={language} 
             onChange={(e) => setLanguage(e.target.value as Language)}
             className="bg-transparent text-sm text-slate-700 font-medium focus:outline-none w-full"
           >
             <option value="en">English</option>
             <option value="ru">Русский (Russian)</option>
             <option value="es">Español (Spanish)</option>
           </select>
        </div>
      </div>

      <div className="p-4 border-b border-slate-100">
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder={language === 'ru' ? "Новая задача..." : "New task..."}
            className="flex-1 min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <Button type="submit" size="sm" variant="primary" className="shrink-0">
            <Plus className="w-4 h-4" />
          </Button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-hide">
        {tasks.length === 0 ? (
          <div className="text-center py-10 px-4">
            <div className="bg-slate-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm">{language === 'ru' ? "Нет задач." : "No tasks yet."}</p>
            <p className="text-slate-400 text-xs mt-1">{language === 'ru' ? "Добавьте задачу, чтобы начать!" : "Add a task to get started!"}</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`group flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm ${
                currentTaskId === task.id
                  ? 'bg-indigo-50 border-indigo-200'
                  : 'bg-white border-slate-200 hover:border-indigo-200'
              }`}
              onClick={() => selectTask(task.id)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const nextStatus = task.status === TaskStatus.COMPLETED 
                    ? TaskStatus.PENDING 
                    : TaskStatus.COMPLETED;
                  updateTaskStatus(task.id, nextStatus);
                }}
                className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors"
              >
                {task.status === TaskStatus.COMPLETED ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </button>
              
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${
                  task.status === TaskStatus.COMPLETED ? 'text-slate-400 line-through' : 'text-slate-800'
                }`}>
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    task.status === TaskStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' :
                    task.status === TaskStatus.IN_PROGRESS ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(task.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTask(task.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};