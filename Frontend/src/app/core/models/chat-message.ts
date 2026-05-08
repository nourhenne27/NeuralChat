export interface SourceDto {
  documentTitle: string;
  excerpt:       string;
  score:         number;
}

export interface CreateSessionResponse {
  sessionId: string;
}

export interface ChatRequestDto {
  sessionId?: string | null;
  message: string;
}

export interface ChatMessageDto {
  id:        string;
  sessionId: string;
  role:      'user' | 'assistant';
  content: string;
  hasAnswer?: boolean;
  createdAt: string;
  sources:   SourceDto[];
}

export interface ChatSessionDto {
  id:        string;
  title:     string;
  createdAt: string;
  messages:  ChatMessageDto[];
}

export interface ChatMessage {
  role:        'user' | 'assistant';
  content:     string;
  timestamp:   Date;
  messageId?:  string;
  sources?:    SourceDto[];
  confidence?: number;
  isStreaming?: boolean;
  liked?:      boolean;
  disliked?:   boolean;
  hasAnswer?:  boolean;  // ← ajouter cette ligne
}