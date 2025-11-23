import { ChatMessage, FeedbackReport } from '../types';

const API_BASE = '/api/interview';

export const startInterview = async (
    applicationId: string,
    provider: string = 'gemini'
): Promise<{ text: string; audioData?: string }> => {
    const response = await fetch(`${API_BASE}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, provider }),
    });
    if (!response.ok) throw new Error('Failed to start interview');
    return response.json();
};

export const generateTurn = async (
    applicationId: string,
    history: ChatMessage[],
    message: string | { audioData: string, mimeType: string },
    provider: string = 'gemini'
): Promise<{ text: string; audioData?: string }> => {
    const response = await fetch(`${API_BASE}/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            applicationId,
            history,
            message,
            provider
        }),
    });
    if (!response.ok) throw new Error('Failed to generate turn');
    return response.json();
};

export const generateFeedback = async (
    applicationId: string,
    history: ChatMessage[],
    provider: string = 'gemini'
): Promise<FeedbackReport> => {
    const response = await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, history, provider }),
    });
    if (!response.ok) throw new Error('Failed to generate feedback');
    return response.json();
};
