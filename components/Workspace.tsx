import React, { useState, useRef, useEffect } from 'react';
import { Task, AssistanceMode, ChatMessage, Language } from '../types';
import { generateResponse } from '../services/geminiService';
import { Send, Image as ImageIcon, X, Loader2, BookOpen, Calculator, Bot, Sparkles, ArrowLeft, ChevronLeft } from 'lucide-react';
import { Button } from './Button';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface WorkspaceProps {
  activeTask: Task | null;
  onUpdateStatus: (status: any) => void;
  language: Language;
  onBack: () => void;
}

export const Workspace: React.FC<WorkspaceProps> = ({ activeTask, language, onBack }) => {
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
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
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

    // Determine mode if not set
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

    try {
      // Prepare history for Gemini
      const history = messages.map(m => {
        const parts: any[] = [];
        if (m.imageUrl) {
          const match = m.imageUrl.match(/^data:(.*?);base64,(.*)$/);
          if (match) {
            parts.push({
              inlineData: {
                mimeType: match[1],
                data: match[2]
              }
            });
          }
        }
        if (m.text) parts.push({ text: m.text });
        return { role: m.role, parts: parts };
      });

      // Add current message to history
      const currentParts: any[] = [];
      if (userMessage.imageUrl) {
        const match = userMessage.imageUrl.match(/^data:(.*?);base64,(.*)$/);
        if (match) {
            currentParts.push({
              inlineData: {
                mimeType: match[1],
                data: match[2]
              }
            });
        }
      }
      if (userMessage.text) {
        currentParts.push({ text: userMessage.text });
      }
      history.push({ role: 'user', parts: currentParts });

      const responseText = await generateResponse(
        userMessage.text || (userMessage.imageUrl ? (language === 'ru' ? "Проанализируй это изображение" : "Analyze this image") : ""),
        userMessage.imageUrl?.split(',')[1],
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
    } catch (error) {
      console.error(error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: language === 'ru' ? "Произошла ошибка. Попробуйте еще раз." : "Sorry, an error occurred. Please try again.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!activeTask) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full glass-panel md:rounded-r-2xl border border-white/20 dark:border-slate-700/50 transition-colors duration-300 overflow-hidden">
        <div className="relative animate-float">
            <div className="absolute -inset-4 bg-indigo-500/20 rounded-full blur-xl animate-pulse-slow"></div>
            <div className="relative w-24 h-24 bg-white dark:bg-slate-800 rounded-3xl shadow-xl flex items-center justify-center mb-6 ring-1 ring-white/50 dark:ring-slate-700">
              <Sparkles className="w-10 h-10 text-indigo-500 animate-[spin_10s_linear_infinite]" />
            </div>
        </div>
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-3 tracking-tight animate-fade-in-scale">
          {language === 'ru' ? "Выберите задачу" : "Select a Task"}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md text-lg leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {language === 'ru' 
            ? "Выберите задачу на панели слева, чтобы начать сессию с ИИ-помощником." 
            : "Choose a task from the sidebar to start your AI-powered study session."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white/90 dark:bg-slate-900/90 md:rounded-r-2xl shadow-2xl backdrop-blur-sm overflow-hidden relative transition-colors duration-300">
      {/* Header */}
      <div className="px-4 md:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Mobile Back Button */}
          <button 
            onClick={onBack}
            className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Back to tasks"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="min-w-0 animate-fade-in">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">
              {activeTask.title}
            </h2>
            {mode ? (
               <div className="flex items-center gap-2 mt-1 animate-slide-up">
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    mode === AssistanceMode.HELP 
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                  }`}>
                    {mode === AssistanceMode.HELP 
                      ? (language === 'ru' ? 'Обучение' : 'Learn') 
                      : (language === 'ru' ? 'Решение' : 'Solve')}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 truncate hidden sm:inline flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {language === 'ru' ? 'ИИ Активен' : 'AI Active'}
                  </span>
               </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {language === 'ru' ? "Настройка сессии..." : "Setting up session..."}
              </p>
            )}
          </div>
        </div>
        
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => {
            setMessages([]);
            setMode(null);
          }} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 flex-shrink-0 ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95">
            <ArrowLeft className="w-4 h-4 mr-1 hidden sm:inline" />
            <ArrowLeft className="w-4 h-4 sm:hidden" />
            <span className="hidden sm:inline">{language === 'ru' ? 'Заново' : 'Reset'}</span>
          </Button>
        )}
      </div>

      {/* Chat Area */}
      {/* Increased bottom padding to accommodate raised input on mobile */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 pb-40 md:pb-32 space-y-8 bg-slate-50/50 dark:bg-slate-950/50 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center max-w-3xl mx-auto animate-fade-in">
            <div className="text-center mb-6 md:mb-10 px-4">
              <h3 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-2 md:mb-3">
                {language === 'ru' ? "Как будем работать?" : "How should we tackle this?"}
              </h3>
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">
                {language === 'ru' ? "Выберите режим помощи для этой задачи" : "Select the assistance mode for this specific task"}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full px-4 pb-20 md:pb-0">
              <button
                onClick={() => setMode(AssistanceMode.HELP)}
                className={`group relative p-6 md:p-8 rounded-2xl border-2 text-left transition-all duration-500 hover:-translate-y-2 animate-float ${
                  mode === AssistanceMode.HELP 
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 ring-4 ring-indigo-100 dark:ring-indigo-900/20' 
                    : 'border-white dark:border-slate-800 bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-2xl hover:shadow-indigo-500/20'
                }`}
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-500 group-hover:rotate-12 group-hover:scale-110">
                   <BookOpen className="w-20 h-20 md:w-24 md:h-24 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-4 md:mb-6 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <h4 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-2 md:mb-3 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                  {language === 'ru' ? "Объясни мне" : "Help Me Learn"}
                </h4>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {language === 'ru' 
                    ? "Идеально для изучения. Я буду задавать наводящие вопросы и объяснять теорию."
                    : "Perfect for studying. I'll guide you with hints and explanations to help you understand."}
                </p>
              </button>

              <button
                onClick={() => setMode(AssistanceMode.SOLVE)}
                className={`group relative p-6 md:p-8 rounded-2xl border-2 text-left transition-all duration-500 hover:-translate-y-2 animate-float-delayed ${
                  mode === AssistanceMode.SOLVE
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 ring-4 ring-amber-100 dark:ring-amber-900/20' 
                    : 'border-white dark:border-slate-800 bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-2xl hover:shadow-amber-500/20'
                }`}
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-500 group-hover:-rotate-12 group-hover:scale-110">
                   <Calculator className="w-20 h-20 md:w-24 md:h-24 text-amber-600 dark:text-amber-500" />
                </div>
                <div className="w-12 h-12 md:w-14 md:h-14 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mb-4 md:mb-6 text-amber-600 dark:text-amber-500 group-hover:scale-110 transition-transform duration-300">
                  <Calculator className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <h4 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-2 md:mb-3 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                  {language === 'ru' ? "Реши за меня" : "Solve It"}
                </h4>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {language === 'ru'
                    ? "Быстрое решение. Я предоставлю полный ответ и алгоритм решения."
                    : "Quick solution. I'll provide the direct answer and the steps to verify it."}
                </p>
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={msg.id}
              className={`flex gap-3 md:gap-4 animate-slide-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0 mt-2 shadow-sm">
                  <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
              )}
              
              <div
                className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 md:p-5 shadow-sm transition-shadow hover:shadow-md ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-tr-sm'
                    : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-sm shadow-md'
                }`}
              >
                {msg.imageUrl && (
                  <div className="mb-4 rounded-xl overflow-hidden bg-black/5">
                    <img 
                      src={msg.imageUrl} 
                      alt="Uploaded" 
                      className="max-w-full w-auto max-h-[300px] object-contain"
                    />
                  </div>
                )}
                <div className={`prose prose-sm md:prose-base max-w-none break-words ${
                  msg.role === 'user' ? 'prose-invert' : 'text-slate-800 dark:text-slate-100 dark:prose-invert'
                }`}>
                  <ReactMarkdown 
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                       code({className, children, ...props}) {
                        return (
                          <code className={`${className} ${
                            msg.role === 'user' 
                              ? 'bg-indigo-500/30' 
                              : 'bg-slate-100 dark:bg-slate-700/50'
                          } px-1 py-0.5 rounded text-sm`} {...props}>
                            {children}
                          </code>
                        )
                       }
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
                <div className={`text-[10px] mt-2 opacity-60 text-right ${msg.role === 'user' ? 'text-indigo-100' : 'text-slate-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 mt-2 overflow-hidden shadow-sm">
                   <div className="w-full h-full bg-gradient-to-br from-slate-400 to-slate-500 dark:from-slate-600 dark:to-slate-700"></div>
                </div>
              )}
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start gap-4 animate-slide-up">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
               <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-sm px-6 py-4 shadow-sm flex items-center gap-3">
              <span className="flex space-x-1">
                <span className="w-2 h-2 bg-indigo-400 dark:bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-indigo-400 dark:bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-indigo-400 dark:bg-indigo-500 rounded-full animate-bounce"></span>
              </span>
              <span className="text-slate-400 dark:text-slate-500 text-xs font-medium uppercase tracking-wide animate-pulse">
                 {language === 'ru' ? "Думаю..." : "Thinking"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Input Area */}
      {/* Added extra padding bottom (pb-8) to lift the bar above mobile home indicator */}
      <div className="absolute bottom-0 left-0 right-0 px-3 pt-3 pb-8 md:p-6 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-slate-950 dark:via-slate-950/90 pointer-events-none transition-colors duration-300 z-30">
        <div className="pointer-events-auto max-w-4xl mx-auto">
           {selectedImage && (
            <div className="animate-slide-up mb-2 inline-flex items-center gap-2 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 shadow-lg px-3 py-1.5 rounded-xl">
              <ImageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium max-w-[150px] truncate">
                {language === 'ru' ? "Изображение прикреплено" : "Image attached"}
              </span>
              <button onClick={() => setSelectedImage(null)} className="ml-2 bg-slate-100 dark:bg-slate-700 rounded-full p-0.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          
          <div className="bg-white dark:bg-slate-800 p-2 rounded-[24px] shadow-2xl shadow-indigo-900/10 dark:shadow-black/50 border border-slate-200/60 dark:border-slate-700 flex items-end gap-2 relative transition-all duration-300 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 dark:focus-within:border-indigo-600 focus-within:transform focus-within:-translate-y-1">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
            
            <Button 
              variant="secondary" 
              className="rounded-full w-10 h-10 p-0 flex-shrink-0 border-0 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition-transform active:scale-95"
              onClick={() => (fileInputRef.current as any)?.click()}
              title={language === 'ru' ? "Загрузить фото" : "Upload Image"}
            >
              <ImageIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </Button>

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
                ? (language === 'ru' ? "Спросите о чем угодно..." : "Ask anything about this task...") 
                : (language === 'ru' ? "Сначала выберите режим..." : "Select a mode above first...")}
              disabled={!mode && messages.length === 0}
              className="w-full bg-transparent border-0 py-2.5 px-2 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-0 resize-none max-h-32 min-h-[44px]"
              rows={1}
            />

            <Button 
              variant={(!input.trim() && !selectedImage) ? "secondary" : "gradient"}
              className={`rounded-full h-10 w-10 md:w-auto md:px-5 flex-shrink-0 transition-all duration-300 ${
                (!input.trim() && !selectedImage) 
                  ? 'opacity-50 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600' 
                  : 'hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/30'
              }`}
              disabled={(!input.trim() && !selectedImage) || isLoading || (!mode && messages.length === 0)}
              onClick={() => mode && handleSend(mode)}
            >
              <Send className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline font-semibold">
                {language === 'ru' ? "Отправить" : "Send"}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};