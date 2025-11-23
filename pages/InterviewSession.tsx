import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApplicationById, createSession, getSessionById, updateSession, generateId } from '../services/apiService';
import { startInterview, generateTurn, generateFeedback } from '../services/interviewService';
import { Application, ChatMessage, InterviewSession as SessionType, SessionStatus, Sender, FeedbackReport, MAX_FEEDBACK_SCORE } from '../types';
import AudioVisualizer from '../components/AudioVisualizer';

const InterviewSession: React.FC = () => {
  const { appId, sessionId } = useParams();
  const navigate = useNavigate();

  const [app, setApp] = useState<Application | null>(null);
  const [session, setSession] = useState<SessionType | null>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [provider, setProvider] = useState<string>('gemini');

  // Refs for Media
  const videoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize Session
  useEffect(() => {
    const init = async () => {
      if (appId) {
        const foundApp = await getApplicationById(appId);
        if (!foundApp) {
          navigate('/');
          return;
        }
        setApp(foundApp);

        // If creating new session (route: /session/new/:appId)
        if (!sessionId) {
          const newSession: SessionType = {
            id: generateId(),
            applicationId: appId,
            status: SessionStatus.CREATED,
            messages: [],
            createdAt: new Date().toISOString()
          };
          await createSession(newSession);
          setSession(newSession);
          // Don't start automatically, let user choose provider first
        }
      } else if (sessionId) {
        // If viewing existing session
        const existingSession = await getSessionById(sessionId);
        if (existingSession) {
          setSession(existingSession);
          setMessages(existingSession.messages);
          const foundApp = await getApplicationById(existingSession.applicationId);
          if (foundApp) setApp(foundApp);
        } else {
          navigate('/');
        }
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, sessionId, navigate]);

  // Setup Camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };
    if (session?.status !== SessionStatus.COMPLETED) {
      startCamera();
    }
    return () => {
      // Cleanup stream on unmount
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [session?.status]);

  const handleStartInterview = async () => {
    if (!app || !session) return;
    setIsProcessing(true);
    try {
      const response = await startInterview(app.id, provider);

      const aiMsg: ChatMessage = {
        id: generateId(),
        sender: Sender.AI,
        text: response.text,
        audioData: response.audioData,
        timestamp: Date.now()
      };

      setMessages([aiMsg]);

      // Update DB
      const s = await getSessionById(session.id);
      if (s) {
        s.messages = [aiMsg];
        s.status = SessionStatus.IN_PROGRESS;
        await updateSession(s);
        setSession(s);
      }

      // Play intro audio
      playAudio(response.audioData);

    } catch (err) {
      console.error(err);
      alert("Error starting interview. Check backend logs.");
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = (base64Audio?: string) => {
    if (!base64Audio) return;
    const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
    audio.play().catch(e => console.error("Audio playback failed", e));
  };

  const handleSendMessage = async (textInput?: string, audioBlob?: Blob) => {
    if ((!input.trim() && !audioBlob) || !app || !session) return;

    setIsProcessing(true);

    // 1. Add User Message to State
    const userMsg: ChatMessage = {
      id: generateId(),
      sender: Sender.USER,
      text: textInput || "(Audio Response)",
      timestamp: Date.now()
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');

    // 2. Prepare payload for AI
    let payload: string | { audioData: string, mimeType: string } = textInput || '';

    if (audioBlob) {
      const base64Audio = await blobToBase64(audioBlob);
      payload = { audioData: base64Audio, mimeType: audioBlob.type };
    }

    // 3. Call AI Service
    try {
      const response = await generateTurn(
        app.id,
        updatedMessages,
        payload,
        provider
      );

      const aiMsg: ChatMessage = {
        id: generateId(),
        sender: Sender.AI,
        text: response.text,
        audioData: response.audioData,
        timestamp: Date.now()
      };

      const finalMessages = [...updatedMessages, aiMsg];
      setMessages(finalMessages);

      // Update DB
      const updatedSession = { ...session, messages: finalMessages };
      await updateSession(updatedSession);
      setSession(updatedSession);

      playAudio(response.audioData);

    } catch (err) {
      console.error(err);
      alert("Error generating response. Check API Key.");
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        handleSendMessage(undefined, audioBlob);
        // Stop tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied", err);
      alert("Microphone access is required for audio features.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Remove data url prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const finishSession = async () => {
    if (!app || !session) return;
    if (!window.confirm("Are you sure you want to finish and generate feedback?")) return;

    setIsProcessing(true);
    try {
      const feedback = await generateFeedback(app.id, messages, provider);

      const completedSession: SessionType = {
        ...session,
        status: SessionStatus.COMPLETED,
        feedback
      };
      await updateSession(completedSession);
      setSession(completedSession);
      setIsProcessing(false);
    } catch (err) {
      console.error("Error generating feedback", err);
      setIsProcessing(false);
    }
  };

  // --- Render Views ---

  if (!session || !app) return <div className="p-10 text-center">Loading session...</div>;

  if (session.status === SessionStatus.CREATED) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-4">Ready to Start?</h2>
        <p className="mb-6 text-gray-600">
          You are about to interview for <strong>{app.jobTitle}</strong> at <strong>{app.companyName}</strong>.
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select AI Interviewer Model</label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
          >
            <option value="gemini">Google Gemini (Fast, Audio Support)</option>
            <option value="openai">OpenAI GPT-4o (High Quality)</option>
            <option value="deepseek">DeepSeek (Text Only)</option>
          </select>
          <p className="mt-2 text-xs text-gray-500">
            Note: DeepSeek does not support audio output.
          </p>
        </div>

        <button
          onClick={handleStartInterview}
          disabled={isProcessing}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isProcessing ? 'Initializing...' : 'Start Interview'}
        </button>
      </div>
    );
  }

  if (session.status === SessionStatus.COMPLETED && session.feedback) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="border-b border-gray-200 pb-5 mb-5 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Evaluation Report</h2>
              <p className="text-gray-500">{app.jobTitle} at {app.companyName}</p>
            </div>
            <div className="flex items-center">
              <div className="text-4xl font-bold text-blue-600">{session.feedback.overallScore}</div>
              <span className="text-gray-400 ml-2 text-sm">/ {MAX_FEEDBACK_SCORE}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-green-700 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Strengths
              </h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {session.feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-600 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Weaknesses
              </h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {session.feedback.weaknesses.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          </div>

          <div className="mt-8 bg-blue-50 p-5 rounded-lg border border-blue-100">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Recommendations</h3>
            <ul className="list-decimal list-inside space-y-2 text-blue-900">
              {session.feedback.improvements.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Summary</h3>
            <p className="text-gray-700 leading-relaxed">{session.feedback.summary}</p>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gray-800 text-white rounded-lg shadow hover:bg-gray-900 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-4">
      {/* Left: Video/Interviewer Context */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <div className="bg-black rounded-2xl overflow-hidden aspect-video relative shadow-lg">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />
          <div className="absolute bottom-3 left-3 bg-black/50 px-2 py-1 rounded text-white text-xs">
            You (Camera)
          </div>
          {isRecording && (
            <div className="absolute top-3 right-3 flex items-center bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
              <span className="w-2 h-2 bg-white rounded-full mr-1"></span> REC
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex-1 overflow-y-auto">
          <h3 className="font-bold text-gray-900 mb-2">Interview Context</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p><span className="font-semibold">Role:</span> {app.jobTitle}</p>
            <p><span className="font-semibold">Company:</span> {app.companyName}</p>
            <p><span className="font-semibold">Model:</span> {provider}</p>
            <hr className="my-2" />
            <p className="text-xs text-gray-400">
              Note: The AI will analyze both your vocal confidence and your answer content.
              Speak clearly.
            </p>
          </div>
        </div>

        <button
          onClick={finishSession}
          disabled={isProcessing || isRecording}
          className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition border border-red-200 disabled:opacity-50"
        >
          End Interview & Get Feedback
        </button>
      </div>

      {/* Right: Chat Interface */}
      <div className="w-full md:w-2/3 bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === Sender.USER ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.sender === Sender.USER
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
                  }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Controls Area */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`p-3 rounded-full transition-all duration-200 ${isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white ring-4 ring-red-200'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
            >
              {isRecording ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              )}
            </button>

            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isProcessing && handleSendMessage(input)}
                placeholder={isRecording ? "Listening..." : "Type your answer here..."}
                disabled={isRecording || isProcessing}
                className="w-full border-gray-300 rounded-full py-3 px-4 focus:ring-blue-500 focus:border-blue-500 shadow-sm border bg-gray-50 disabled:bg-gray-100"
              />
            </div>

            <button
              onClick={() => handleSendMessage(input)}
              disabled={!input.trim() || isProcessing || isRecording}
              className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
            </button>
          </div>
          <div className="h-6 mt-2 flex items-center justify-center">
            {isRecording && <AudioVisualizer isRecording={isRecording} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewSession;