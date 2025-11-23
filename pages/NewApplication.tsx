import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateId, saveApplication } from '../services/apiService';
import { Application } from '../types';

const NewApplication: React.FC = () => {
  const navigate = useNavigate();
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [pd, setPd] = useState('');
  const [cv, setCv] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newApp: Application = {
        id: generateId(),
        jobTitle,
        companyName,
        positionDescription: pd,
        cvContent: cv,
        createdAt: new Date().toISOString()
      };

      await saveApplication(newApp);
      navigate('/');
    } catch (error) {
      console.error("Failed to save application:", error);
      alert("Failed to save application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            New Application Profile
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Enter the job details and your CV to customize the interview AI.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700">Job Title</label>
            <input
              type="text"
              name="jobTitle"
              id="jobTitle"
              required
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
            />
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="company" className="block text-sm font-medium text-gray-700">Company Name</label>
            <input
              type="text"
              name="company"
              id="company"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
            />
          </div>

          <div className="sm:col-span-6">
            <label htmlFor="pd" className="block text-sm font-medium text-gray-700">
              Position Description (Job Description)
            </label>
            <div className="mt-1">
              <textarea
                id="pd"
                name="pd"
                rows={5}
                required
                value={pd}
                onChange={(e) => setPd(e.target.value)}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                placeholder="Paste the full job description here..."
              />
            </div>
          </div>

          <div className="sm:col-span-6">
            <label htmlFor="cv" className="block text-sm font-medium text-gray-700">
              Your CV / Resume Text
            </label>
            <div className="mt-1">
              <textarea
                id="cv"
                name="cv"
                rows={8}
                required
                value={cv}
                onChange={(e) => setCv(e.target.value)}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                placeholder="Paste the text content of your CV here..."
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">For this demo, please copy and paste the text from your PDF/Doc.</p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Application'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewApplication;