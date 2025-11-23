// Constants
export const MAX_FEEDBACK_SCORE = 100; // Maximum score for interview feedback

export enum Sender {
  USER = 'USER',
  AI = 'AI'
}

export enum SessionStatus {
  CREATED = 'CREATED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export interface Application {
  id: string;
  jobTitle: string;
  companyName: string;
  positionDescription: string;
  cvContent: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
  audioData?: string; // Base64 encoded audio
  timestamp: number;
}

export interface InterviewSession {
  id: string;
  applicationId: string;
  status: SessionStatus;
  messages: ChatMessage[];
  createdAt: string;
  feedback?: FeedbackReport;
}

export interface FeedbackReport {
  overallScore: number; // Score on a scale of 0-MAX_FEEDBACK_SCORE (0-100)
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  summary: string;
}

export interface GeminiConfig {
  apiKey: string;
}