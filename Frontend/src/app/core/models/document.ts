export interface DocumentDto {
  id:         string;
  name:       string;
  format:     'Pdf' | 'Docx' | 'Txt' | 'Md';
  status:     'Pending' | 'Indexed' | 'Failed';
  uploadedAt: string;
}

export interface IndexDocumentResponse {
  documentId: string;
  message:    string;
}


export interface AdminStatsDto {
  totalQuestions:         number;
  totalDocuments:         number;
  totalUsers:             number;
  averageConfidenceScore: number;
}

export interface ActivityItemDto {
  actor:      string;
  action:     string;
  occurredAt: string;
}

export interface ExportReportDto {
  generatedAt:    string;
  stats:          AdminStatsDto;
  users:          import('../models/auth-response').UserDto[];
  recentActivity: ActivityItemDto[];
}