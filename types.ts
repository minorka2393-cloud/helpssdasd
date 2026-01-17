export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt: number;
}

export enum AssistanceMode {
  HELP = 'HELP', // Guide the user, Socratic method
  SOLVE = 'SOLVE', // Direct solution
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  imageUrl?: string;
  timestamp: number;
}

export interface AIState {
  isLoading: boolean;
  error: string | null;
  messages: ChatMessage[];
}

export type Language = 'en' | 'ru' | 'es';

export type Theme = 'light' | 'dark';