export interface FeedbackDto {
  messageId: string;
  score: number;   // 1 à 5 (backend: [Range(1,5)])
  comment?: string;
}