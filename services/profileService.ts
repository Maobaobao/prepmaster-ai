import {
  UserProfile,
  CareerRecord,
  EducationRecord,
  AchievementRecord,
  CertificateRecord,
  ProjectRecord,
  ImportPreview,
} from '../types';

const API_BASE = '/api/profile';

export const getProfile = async (): Promise<UserProfile> => {
  const res = await fetch(`${API_BASE}`);
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
};

export const saveProfile = async (profile: Partial<UserProfile>): Promise<UserProfile> => {
  const res = await fetch(`${API_BASE}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  if (!res.ok) throw new Error('Failed to save profile');
  return res.json();
};

// Career
export const listCareer = async (): Promise<CareerRecord[]> => {
  const res = await fetch(`${API_BASE}/career`);
  if (!res.ok) throw new Error('Failed to list career');
  return res.json();
};
export const createCareer = async (rec: Partial<CareerRecord>): Promise<CareerRecord> => {
  const res = await fetch(`${API_BASE}/career`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rec),
  });
  if (!res.ok) throw new Error('Failed to create career');
  return res.json();
};
export const updateCareer = async (id: number, rec: Partial<CareerRecord>): Promise<CareerRecord> => {
  const res = await fetch(`${API_BASE}/career/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rec),
  });
  if (!res.ok) throw new Error('Failed to update career');
  return res.json();
};
export const deleteCareer = async (id: number): Promise<void> => {
  const res = await fetch(`${API_BASE}/career/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete career');
};

// Education
export const listEducation = async (): Promise<EducationRecord[]> => {
  const res = await fetch(`${API_BASE}/education`);
  if (!res.ok) throw new Error('Failed to list education');
  return res.json();
};
export const createEducation = async (rec: Partial<EducationRecord>): Promise<EducationRecord> => {
  const res = await fetch(`${API_BASE}/education`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rec),
  });
  if (!res.ok) throw new Error('Failed to create education');
  return res.json();
};
export const updateEducation = async (id: number, rec: Partial<EducationRecord>): Promise<EducationRecord> => {
  const res = await fetch(`${API_BASE}/education/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rec),
  });
  if (!res.ok) throw new Error('Failed to update education');
  return res.json();
};
export const deleteEducation = async (id: number): Promise<void> => {
  const res = await fetch(`${API_BASE}/education/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete education');
};

// Achievements
export const listAchievements = async (): Promise<AchievementRecord[]> => {
  const res = await fetch(`${API_BASE}/achievement`);
  if (!res.ok) throw new Error('Failed to list achievements');
  return res.json();
};
export const createAchievement = async (rec: Partial<AchievementRecord>): Promise<AchievementRecord> => {
  const res = await fetch(`${API_BASE}/achievement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rec),
  });
  if (!res.ok) throw new Error('Failed to create achievement');
  return res.json();
};
export const updateAchievement = async (id: number, rec: Partial<AchievementRecord>): Promise<AchievementRecord> => {
  const res = await fetch(`${API_BASE}/achievement/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rec),
  });
  if (!res.ok) throw new Error('Failed to update achievement');
  return res.json();
};
export const deleteAchievement = async (id: number): Promise<void> => {
  const res = await fetch(`${API_BASE}/achievement/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete achievement');
};

// Certificates
export const listCertificates = async (): Promise<CertificateRecord[]> => {
  const res = await fetch(`${API_BASE}/certificate`);
  if (!res.ok) throw new Error('Failed to list certificates');
  return res.json();
};
export const createCertificate = async (rec: Partial<CertificateRecord>): Promise<CertificateRecord> => {
  const res = await fetch(`${API_BASE}/certificate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rec),
  });
  if (!res.ok) throw new Error('Failed to create certificate');
  return res.json();
};
export const updateCertificate = async (id: number, rec: Partial<CertificateRecord>): Promise<CertificateRecord> => {
  const res = await fetch(`${API_BASE}/certificate/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rec),
  });
  if (!res.ok) throw new Error('Failed to update certificate');
  return res.json();
};
export const deleteCertificate = async (id: number): Promise<void> => {
  const res = await fetch(`${API_BASE}/certificate/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete certificate');
};

// Projects
export const listProjects = async (): Promise<ProjectRecord[]> => {
  const res = await fetch(`${API_BASE}/project`);
  if (!res.ok) throw new Error('Failed to list projects');
  return res.json();
};
export const createProject = async (rec: Partial<ProjectRecord>): Promise<ProjectRecord> => {
  const res = await fetch(`${API_BASE}/project`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rec),
  });
  if (!res.ok) throw new Error('Failed to create project');
  return res.json();
};
export const updateProject = async (id: number, rec: Partial<ProjectRecord>): Promise<ProjectRecord> => {
  const res = await fetch(`${API_BASE}/project/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rec),
  });
  if (!res.ok) throw new Error('Failed to update project');
  return res.json();
};
export const deleteProject = async (id: number): Promise<void> => {
  const res = await fetch(`${API_BASE}/project/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete project');
};

// Import
export const importFromText = async (text: string): Promise<ImportPreview> => {
  const res = await fetch(`${API_BASE}/import?source=text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('Failed to parse text');
  return res.json();
};

export const importFromLinkedIn = async (url: string): Promise<ImportPreview> => {
  const res = await fetch(`${API_BASE}/import?source=linkedin_url&url=${encodeURIComponent(url)}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to import from LinkedIn URL');
  return res.json();
};

export const applyImport = async (source: 'text'|'linkedin_url'|'pdf'|'docx', payload: FormData|{ text?: string; url?: string }): Promise<void> => {
  let url = `${API_BASE}/import?source=${source}&apply=true`;
  let res: Response;
  if (payload instanceof FormData) {
    res = await fetch(url, { method: 'POST', body: payload });
  } else {
    res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  }
  if (!res.ok) throw new Error('Failed to apply import');
};

