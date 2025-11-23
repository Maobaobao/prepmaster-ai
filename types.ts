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

export interface UserProfile {
  id: number;
  fullName?: string;
  headline?: string;
  location?: string;
  summary?: string;
  lastUpdated?: string;
}

export interface CareerRecord {
  id: number;
  profileId: number;
  title?: string;
  company?: string;
  employmentType?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  location?: string;
  description?: string;
  skills?: string;
  createdAt?: string;
}

export interface EducationRecord {
  id: number;
  profileId: number;
  school?: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  grade?: string;
  activities?: string;
  description?: string;
  createdAt?: string;
}

export interface AchievementRecord {
  id: number;
  profileId: number;
  title: string;
  issuer?: string;
  issueDate?: string;
  url?: string;
  description?: string;
  createdAt?: string;
}

export interface CertificateRecord {
  id: number;
  profileId: number;
  name: string;
  authority?: string;
  licenseNumber?: string;
  issueDate?: string;
  expirationDate?: string;
  url?: string;
  description?: string;
  createdAt?: string;
}

export interface ProjectRecord {
  id: number;
  profileId: number;
  name: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  url?: string;
  skills?: string;
  description?: string;
  createdAt?: string;
}

export interface ImportPreview {
  preview: {
    career: Partial<CareerRecord>[];
    education: Partial<EducationRecord>[];
    achievements: Partial<AchievementRecord>[];
    certificates: Partial<CertificateRecord>[];
    projects: Partial<ProjectRecord>[];
  };
}
