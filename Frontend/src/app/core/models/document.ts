export interface DocumentDto {
  id:           string;
  name:         string;
  format:       string;
  status:       'Pending' | 'Indexed' | 'Failed' | 'Deleting';
  roleRequired: 'User' | 'Manager' | 'Admin'; // ✅ ajout
  uploadedAt:   string;
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