import React, { useState, useRef, useEffect } from 'react';
import { Task, AssistanceMode, ChatMessage, Language } from '../types';
import { generateResponse } from '../services/geminiService';
import { Send, Image as ImageIcon, X, Loader2, BookOpen, Calculator } from 'lucide-react';
import { Button } from './Button';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface WorkspaceProps {
  activeTask: Task | null;
  onUpdateStatus: (status: any) => void;
  language: Language;
}

export const Workspace: React.FC<WorkspaceProps> = ({ activeTask, language }) => {
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AssistanceMode | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear messages when switching tasks
  useEffect(() => {
    setMessages([]);
    setMode(null);
    setInput('');
    setSelectedImage(null);
  }, [activeTask?.id]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      (scrollRef.current as any).scrollTop = (scrollRef.current as any).scrollHeight;
    }
  }, [messages, isLoading]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = (e.target as any).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (selectedMode: AssistanceMode) => {
    if ((!input.trim() && !selectedImage)) return;

    // Determine mode if not set (first interaction sets the session mode)
    const currentMode = mode || selectedMode;
    if (!mode) setMode(selectedMode);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      imageUrl: selectedImage || undefined,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setInput('');
    setSelectedImage(null);

    // Prepare history for Gemini with full context (including images)
    // This fixes the "assistant forgets images" issue
    const history = messages.map(m => {
      const parts: any[] = [];
      
      if (m.imageUrl) {
        // We must strip the data URL prefix to get raw base64
        // data:image/jpeg;base64,....
        const base64Data = m.imageUrl.split(',')[1];
        if (base64Data) {
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg', // We assume jpeg/png compatibility or generic handling by API
              data: base64Data
            }
          });
        }
      }
      
      if (m.text) {
        parts.push({ text: m.text });
      }
      
      return {
        role: m.role,
        parts: parts
      };
    });

    const responseText = await generateResponse(
      userMessage.text || (userMessage.imageUrl ? (language === 'ru' ? "Проанализируй это изображение" : "Analyze this image") : ""),
      userMessage.imageUrl?.split(',')[1], // Remove base64 header for current image
      currentMode,
      history,
      language
    );

    const botMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, botMessage]);
    setIsLoading(false);
  };

  if (!activeTask) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
          <BookOpen className="w-10 h-10 text-indigo-300" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          {language === 'ru' ? "Выберите задачу" : "Select a Task"}
        </h2>
        <p className="text-slate-500 max-w-md">
          {language === 'ru' 
            ? "Выберите задачу на панели управления, чтобы начать получать помощь или решения." 
            : "Choose a task from the sidebar control panel to start getting help or solutions."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{activeTask.title}</h2>
          {mode && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${
              mode === AssistanceMode.HELP ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {mode === AssistanceMode.HELP 
                ? (language === 'ru' ? 'Режим обучения' : 'Learning Mode')
                : (language === 'ru' ? 'Режим решения' : 'Solver Mode')}
            </span>
          )}
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => {
            setMessages([]);
            setMode(null);
          }}>
            {language === 'ru' ? 'Сбросить' : 'Reset Session'}
          </Button>
        )}
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto animate-fade-in">
            <h3 className="text-2xl font-semibold text-slate-800 mb-8 text-center">
              {language === 'ru' ? "Как нам справиться с этой задачей?" : "How should we handle this task?"}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <button
                onClick={() => setMode(AssistanceMode.HELP)}
                className={`p-6 rounded-2xl border-2 transition-all text-left hover:scale-[1.02] ${
                  mode === AssistanceMode.HELP 
                    ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200' 
                    : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-lg'
                }`}
              >
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-indigo-600" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">
                  {language === 'ru' ? "Помоги мне научиться" : "Help Me Learn"}
                </h4>
                <p className="text-sm text-slate-500">
                  {language === 'ru' 
                    ? "Я хочу понять концепцию. Проведи меня шаг за шагом с объяснениями."
                    : "I want to understand the concept. Guide me through it step-by-step with explanations."}
                </p>
              </button>

              <button
                onClick={() => setMode(AssistanceMode.SOLVE)}
                className={`p-6 rounded-2xl border-2 transition-all text-left hover:scale-[1.02] ${
                  mode === AssistanceMode.SOLVE
                    ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200' 
                    : 'border-slate-200 bg-white hover:border-amber-300 hover:shadow-lg'
                }`}
              >
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                  <Calculator className="w-6 h-6 text-amber-600" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">
                  {language === 'ru' ? "Реши это" : "Solve It"}
                </h4>
                <p className="text-sm text-slate-500">
                  {language === 'ru'
                    ? "Мне просто нужен ответ и шаги для его получения. Без лишних вопросов."
                    : "I just need the answer and the steps to get there. No questions asked."}
                </p>
              </button>
            </div>
            
            <p className="mt-8 text-sm text-slate-400">
              {language === 'ru'
                ? "Выберите режим выше, затем введите вопрос или загрузите изображение ниже."
                : "Select a mode above, then type your question or upload an image below."}
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 md:p-5 shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                }`}
              >
                {msg.imageUrl && (
                  <img 
                    src={msg.imageUrl} 
                    alt="Uploaded content" 
                    className="max-w-full rounded-lg mb-3 border border-black/10"
                    style={{ maxHeight: '300px' }}
                  />
                )}
                <div className={`prose prose-sm md:prose-base max-w-none break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 ${
                  msg.role === 'user' ? 'prose-invert text-white' : 'text-slate-800'
                }`}>
                  <ReactMarkdown 
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
              <span className="text-slate-500 text-sm font-medium">
                {language === 'ru' ? "Helper-Kust думает..." : "Helper-Kust is thinking..."}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        {selectedImage && (
          <div className="flex items-center gap-2 mb-3 bg-slate-100 w-fit px-3 py-1.5 rounded-full">
            <span className="text-xs text-slate-600 font-medium truncate max-w-[150px]">
              {language === 'ru' ? "Изображение прикреплено" : "Image attached"}
            </span>
            <button onClick={() => setSelectedImage(null)} className="text-slate-400 hover:text-red-500">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        <div className="relative flex items-end gap-2 max-w-4xl mx-auto">
           <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
          <Button 
            variant="secondary" 
            className="rounded-full w-10 h-10 p-0 flex-shrink-0"
            onClick={() => (fileInputRef.current as any)?.click()}
            title="Upload Image"
          >
            <ImageIcon className="w-5 h-5" />
          </Button>

          <div className="relative flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput((e.target as any).value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (mode) handleSend(mode);
                }
              }}
              placeholder={mode 
                ? (language === 'ru' ? "Введите вопрос..." : "Type your question...") 
                : (language === 'ru' ? "Выберите режим..." : "Select a mode first...")}
              disabled={!mode && messages.length === 0}
              className="w-full bg-slate-100 border-0 rounded-2xl px-4 py-3 pr-12 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none max-h-32 min-h-[48px]"
              rows={1}
            />
          </div>

          <Button 
            variant="primary" 
            className={`rounded-full w-12 h-10 md:w-auto md:px-6 transition-all ${(!input.trim() && !selectedImage) || (!mode && messages.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={(!input.trim() && !selectedImage) || isLoading || (!mode && messages.length === 0)}
            onClick={() => mode && handleSend(mode)}
          >
            <span className="hidden md:inline mr-2">
              {language === 'ru' ? "Отправить" : "Send"}
            </span>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};