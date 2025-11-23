import { Application, InterviewSession, SessionStatus, ChatMessage } from '../types';

/**
 * NOTE: In a production environment, this service would implement RESTful API calls 
 * to a backend (Node.js/C#) which interacts with a SQL Server database.
 * 
 * For this React SPA demonstration, we simulate the SQL Server persistence 
 * using LocalStorage to maintain a self-contained, functional environment 
 * without requiring a separate backend server instance.
 */

const STORAGE_KEYS = {
  APPLICATIONS: 'pm_applications',
  SESSIONS: 'pm_sessions',
};

// --- Applications Table ---

export const saveApplication = (app: Application): void => {
  const apps = getApplications();
  apps.push(app);
  localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
};

export const getApplications = (): Application[] => {
  const data = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
  return data ? JSON.parse(data) : [];
};

export const getApplicationById = (id: string): Application | undefined => {
  const apps = getApplications();
  return apps.find(a => a.id === id);
};

// --- Sessions Table ---

export const createSession = (session: InterviewSession): void => {
  const sessions = getSessions();
  sessions.push(session);
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
};

export const getSessions = (): InterviewSession[] => {
  const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  return data ? JSON.parse(data) : [];
};

export const getSessionById = (id: string): InterviewSession | undefined => {
  const sessions = getSessions();
  return sessions.find(s => s.id === id);
};

export const getSessionsByApplicationId = (appId: string): InterviewSession[] => {
  const sessions = getSessions();
  return sessions.filter(s => s.applicationId === appId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const updateSession = (updatedSession: InterviewSession): void => {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === updatedSession.id);
  if (index !== -1) {
    sessions[index] = updatedSession;
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  }
};

// --- Helper Utilities ---

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};
