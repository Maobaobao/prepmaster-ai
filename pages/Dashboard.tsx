import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApplications, getSessionsByApplicationId } from '../services/apiService';
import { Application, InterviewSession } from '../types';

const Dashboard: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [sessionsMap, setSessionsMap] = useState<Record<string, InterviewSession[]>>({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apps = await getApplications();
        setApplications(apps.reverse());

        const map: Record<string, InterviewSession[]> = {};
        await Promise.all(apps.map(async (app) => {
          map[app.id] = await getSessionsByApplicationId(app.id);
        }));
        setSessionsMap(map);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    };
    fetchData();
  }, []);

  const startNewSession = (appId: string) => {
    navigate(`/session/new/${appId}`);
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 md:p-12 shadow-2xl">
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Welcome to Your Interview Prep Hub</h1>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl">Track your applications and practice with AI-powered mock interviews to land your dream job</p>
          <Link
            to="/new"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add New Application
          </Link>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
      </div>

      {/* Applications Grid */}
      {applications.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No applications yet</h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">Get started by adding a job description and your CV to begin practicing for your interviews</p>
          <Link
            to="/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Your First Application
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Your Applications</h2>
              <p className="text-gray-500 mt-1">Track your preparation across {applications.length} position{applications.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-white overflow-hidden rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300 flex flex-col hover-lift"
              >
                {/* Card Header with Gradient */}
                <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-900 mb-1 truncate" title={app.jobTitle}>
                        {app.jobTitle}
                      </h3>
                      <p className="text-sm font-medium text-indigo-600 truncate flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {app.companyName}
                      </p>
                    </div>
                  </div>

                  {/* Sessions Section */}
                  <div className="mt-6">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Recent Sessions
                    </h4>
                    <ul className="space-y-2.5">
                      {sessionsMap[app.id]
                        ?.filter(session => session.status === 'COMPLETED' || session.status === 'IN_PROGRESS')
                        ?.slice(0, 3)
                        .map(session => (
                          <li key={session.id} className="flex items-center justify-between text-sm gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                            <Link
                              to={`/session/${session.id}`}
                              className="text-gray-700 hover:text-indigo-600 truncate flex-1 font-medium"
                            >
                              {new Date(session.createdAt).toLocaleDateString()} - {
                                session.status === 'COMPLETED'
                                  ? `✓ Score: ${session.feedback?.overallScore ?? 'N/A'}`
                                  : '⏸ In Progress'
                              }
                            </Link>
                            {session.status === 'IN_PROGRESS' && (
                              <Link
                                to={`/session/${session.id}`}
                                className="px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg shadow-sm transition-all"
                              >
                                Resume
                              </Link>
                            )}
                          </li>
                        ))}
                      {(!sessionsMap[app.id]?.filter(s => s.status === 'COMPLETED' || s.status === 'IN_PROGRESS').length) && (
                        <li className="text-sm text-gray-400 italic p-2">No practice sessions yet</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 px-6 py-4 border-t border-gray-100">
                  <button
                    onClick={() => startNewSession(app.id)}
                    className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Start Practice Session
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;