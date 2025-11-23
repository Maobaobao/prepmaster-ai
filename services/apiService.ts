import { Application, InterviewSession, ChatMessage } from '../types';

const API_BASE = '/api';

// --- Applications ---

export const saveApplication = async (app: Application): Promise<Application> => {
    const response = await fetch(`${API_BASE}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(app),
    });
    if (!response.ok) throw new Error('Failed to save application');
    return response.json();
};

export const getApplications = async (): Promise<Application[]> => {
    const response = await fetch(`${API_BASE}/applications`);
    if (!response.ok) throw new Error('Failed to fetch applications');
    return response.json();
};

export const getApplicationById = async (id: string): Promise<Application | undefined> => {
    const response = await fetch(`${API_BASE}/applications/${id}`);
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error('Failed to fetch application');
    return response.json();
};

// --- Sessions ---

export const createSession = async (session: InterviewSession): Promise<InterviewSession> => {
    const response = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session),
    });
    if (!response.ok) throw new Error('Failed to create session');
    return response.json();
};

export const getSessions = async (): Promise<InterviewSession[]> => {
    const response = await fetch(`${API_BASE}/sessions`);
    if (!response.ok) throw new Error('Failed to fetch sessions');
    return response.json();
};

export const getSessionById = async (id: string): Promise<InterviewSession | undefined> => {
    const response = await fetch(`${API_BASE}/sessions/${id}`);
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error('Failed to fetch session');
    return response.json();
};

export const getSessionsByApplicationId = async (appId: string): Promise<InterviewSession[]> => {
    const response = await fetch(`${API_BASE}/applications/${appId}/sessions`);
    if (!response.ok) throw new Error('Failed to fetch sessions for application');
    return response.json();
};

export const updateSession = async (updatedSession: InterviewSession): Promise<void> => {
    const response = await fetch(`${API_BASE}/sessions/${updatedSession.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSession),
    });
    if (!response.ok) throw new Error('Failed to update session');
};

// --- Messages ---

export const addMessageToSession = async (sessionId: string, message: ChatMessage): Promise<void> => {
    const response = await fetch(`${API_BASE}/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
    });
    if (!response.ok) throw new Error('Failed to add message');
};

// --- Helper Utilities ---

export const generateId = (): string => {
    return Math.random().toString(36).substring(2, 9);
};
