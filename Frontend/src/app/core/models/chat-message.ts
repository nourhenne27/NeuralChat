export interface CreateSessionResponse {
  sessionId: string;
}

export interface ChatRequestDto {
  sessionId?: string | null;   // ← null ou undefined = backend crée la session
  message: string;
}

export interface ChatMessageDto {
  id:        string;
  sessionId: string;
  role:      'user' | 'assistant';
  content:   string;
  createdAt: string;
}

export interface ChatSessionDto {
  id:        string;
  title:     string;
  createdAt: string;
  messages:  ChatMessageDto[];
}

export interface ChatMessage {
  role:      'user' | 'assistant';
  content:   string;
  timestamp: Date;
  messageId?: string;
  sources?: {
    documentTitle: string;
    excerpt:       string;
    score:         number;
  }[];
  confidence?:  number;
  isStreaming?: boolean;
  liked?:       boolean;
  disliked?:    boolean;
}