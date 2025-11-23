import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { APP_NAME } from '../constants';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path
    ? "bg-white/20 text-white font-semibold shadow-lg"
    : "text-white/80 hover:bg-white/10 hover:text-white";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Modern gradient header */}
      <header className="animated-gradient shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              {/* Logo with modern design */}
              <Link to="/" className="flex items-center group">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div>
                  <span className="text-2xl font-bold text-white tracking-tight">{APP_NAME}</span>
                  <p className="text-xs text-white/70 font-medium">AI Interview Coach</p>
                </div>
              </Link>

              {/* Navigation */}
              <nav className="hidden sm:ml-12 sm:flex sm:space-x-2 items-center">
                <Link to="/" className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive('/')}`}>
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Dashboard
                  </span>
                </Link>
                <Link to="/new" className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive('/new')}`}>
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Application
                  </span>
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main content with subtle background */}
      <main className="flex-1 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            © 2025 AIEQUITAS - {APP_NAME}. Powered by AI to help you ace your interviews.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;