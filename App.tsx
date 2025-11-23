import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import NewApplication from './pages/NewApplication';
import InterviewSession from './pages/InterviewSession';

const App: React.FC = () => {
  // Check for API Key on mount (Developer check)
  if (!process.env.API_KEY) {
    console.error("CRITICAL: process.env.API_KEY is undefined. Please configure the environment variable.");
  }

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/new" element={<NewApplication />} />
          <Route path="/session/new/:appId" element={<InterviewSession />} />
          <Route path="/session/:sessionId" element={<InterviewSession />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;