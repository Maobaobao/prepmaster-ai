import React, { useEffect, useState } from 'react';
import {
  getProfile,
  saveProfile,
  listCareer,
  createCareer,
  updateCareer,
  deleteCareer,
  listEducation,
  createEducation,
  updateEducation,
  deleteEducation,
  listAchievements,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  listCertificates,
  createCertificate,
  updateCertificate,
  deleteCertificate,
  listProjects,
  createProject,
  updateProject,
  deleteProject,
  importFromText,
  importFromLinkedIn,
  applyImport,
} from '../services/profileService';
import {
  UserProfile,
  CareerRecord,
  EducationRecord,
  AchievementRecord,
  CertificateRecord,
  ProjectRecord,
  ImportPreview,
} from '../types';

type Tab = 'Profile' | 'Career' | 'Education' | 'Achievements' | 'Certificates' | 'Projects' | 'Import';

const ProfilePage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('Profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [career, setCareer] = useState<CareerRecord[]>([]);
  const [education, setEducation] = useState<EducationRecord[]>([]);
  const [achievements, setAchievements] = useState<AchievementRecord[]>([]);
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importText, setImportText] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const loadAll = async () => {
    const p = await getProfile();
    setProfile(p);
    setCareer(await listCareer());
    setEducation(await listEducation());
    setAchievements(await listAchievements());
    setCertificates(await listCertificates());
    setProjects(await listProjects());
  };

  useEffect(() => { loadAll(); }, []);

  const updateProfileField = (k: keyof UserProfile, v: any) => {
    if (!profile) return;
    setProfile({ ...profile, [k]: v });
  };

  const onSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const saved = await saveProfile({
        fullName: profile.fullName,
        headline: profile.headline,
        location: profile.location,
        summary: profile.summary,
      });
      setProfile(saved);
    } finally { setSaving(false); }
  };

  const onImportText = async () => {
    const preview = await importFromText(importText);
    setImportPreview(preview);
    setTab('Import');
  };

  const onImportUrl = async () => {
    const preview = await importFromLinkedIn(importUrl);
    setImportPreview(preview);
    setTab('Import');
  };

  const onImportFile = async (kind: 'pdf'|'docx') => {
    if (!importFile) return;
    const fd = new FormData();
    fd.append('file', importFile);
    const res = await fetch(`/api/profile/import?source=${kind}`, { method: 'POST', body: fd });
    if (!res.ok) throw new Error('Failed to parse file');
    setImportPreview(await res.json());
    setTab('Import');
  };

  const onApplyImport = async () => {
    if (!importPreview) return;
    // Apply last used source; simple strategy: prefer text if present
    if (importText) {
      await applyImport('text', { text: importText });
    } else if (importUrl) {
      await applyImport('linkedin_url', { url: importUrl });
    } else if (importFile) {
      const kind = importFile.name.toLowerCase().endswith('.pdf') ? 'pdf' : 'docx';
      const fd = new FormData(); fd.append('file', importFile);
      await applyImport(kind, fd);
    }
    setImportPreview(null);
    await loadAll();
    setTab('Career');
  };

  const Section: React.FC<{ title: string } & React.PropsWithChildren> = ({ title, children }) => (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="bg-white shadow rounded-xl p-4">{children}</div>
    </section>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Profile</h1>
      <div className="flex gap-2 mb-6">
        {(['Profile','Career','Education','Achievements','Certificates','Projects','Import'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg border ${tab===t?'bg-indigo-600 text-white':'bg-white text-gray-700 hover:bg-gray-50'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Profile' && profile && (
        <Section title="Profile Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="border rounded p-2" placeholder="Full Name" value={profile.fullName || ''} onChange={e=>updateProfileField('fullName', e.target.value)} />
            <input className="border rounded p-2" placeholder="Headline" value={profile.headline || ''} onChange={e=>updateProfileField('headline', e.target.value)} />
            <input className="border rounded p-2" placeholder="Location" value={profile.location || ''} onChange={e=>updateProfileField('location', e.target.value)} />
            <textarea className="border rounded p-2 md:col-span-2" placeholder="Summary" value={profile.summary || ''} onChange={e=>updateProfileField('summary', e.target.value)} />
          </div>
          <div className="mt-4">
            <button className="px-4 py-2 bg-indigo-600 text-white rounded" onClick={onSaveProfile} disabled={saving}>{saving? 'Saving...':'Save'}</button>
          </div>
        </Section>
      )}

      {tab === 'Career' && (
        <Section title="Career Records">
          <RecordList
            items={career}
            onCreate={async (rec)=>{ const r = await createCareer(rec); setCareer([...career, r]); }}
            onUpdate={async (id, rec)=>{ const r = await updateCareer(id, rec); setCareer(career.map(x=>x.id===id?r:x)); }}
            onDelete={async (id)=>{ await deleteCareer(id); setCareer(career.filter(x=>x.id!==id)); }}
            fields={[{k:'title',label:'Title'},{k:'company',label:'Company'},{k:'employmentType',label:'Type'},{k:'startDate',label:'Start'},{k:'endDate',label:'End'},{k:'current',label:'Current'},{k:'location',label:'Location'},{k:'skills',label:'Skills'}]}
          />
        </Section>
      )}

      {tab === 'Education' && (
        <Section title="Education Records">
          <RecordList
            items={education}
            onCreate={async (rec)=>{ const r = await createEducation(rec); setEducation([...education, r]); }}
            onUpdate={async (id, rec)=>{ const r = await updateEducation(id, rec); setEducation(education.map(x=>x.id===id?r:x)); }}
            onDelete={async (id)=>{ await deleteEducation(id); setEducation(education.filter(x=>x.id!==id)); }}
            fields={[{k:'school',label:'School'},{k:'degree',label:'Degree'},{k:'fieldOfStudy',label:'Field'},{k:'startDate',label:'Start'},{k:'endDate',label:'End'},{k:'grade',label:'Grade'}]}
          />
        </Section>
      )}

      {tab === 'Achievements' && (
        <Section title="Achievements">
          <RecordList
            items={achievements}
            onCreate={async (rec)=>{ const r = await createAchievement(rec); setAchievements([...achievements, r]); }}
            onUpdate={async (id, rec)=>{ const r = await updateAchievement(id, rec); setAchievements(achievements.map(x=>x.id===id?r:x)); }}
            onDelete={async (id)=>{ await deleteAchievement(id); setAchievements(achievements.filter(x=>x.id!==id)); }}
            fields={[{k:'title',label:'Title'},{k:'issuer',label:'Issuer'},{k:'issueDate',label:'Issue Date'},{k:'url',label:'URL'}]}
          />
        </Section>
      )}

      {tab === 'Certificates' && (
        <Section title="Certificates">
          <RecordList
            items={certificates}
            onCreate={async (rec)=>{ const r = await createCertificate(rec); setCertificates([...certificates, r]); }}
            onUpdate={async (id, rec)=>{ const r = await updateCertificate(id, rec); setCertificates(certificates.map(x=>x.id===id?r:x)); }}
            onDelete={async (id)=>{ await deleteCertificate(id); setCertificates(certificates.filter(x=>x.id!==id)); }}
            fields={[{k:'name',label:'Name'},{k:'authority',label:'Authority'},{k:'licenseNumber',label:'License'},{k:'issueDate',label:'Issue Date'},{k:'expirationDate',label:'Expiration'},{k:'url',label:'URL'}]}
          />
        </Section>
      )}

      {tab === 'Projects' && (
        <Section title="Projects">
          <RecordList
            items={projects}
            onCreate={async (rec)=>{ const r = await createProject(rec); setProjects([...projects, r]); }}
            onUpdate={async (id, rec)=>{ const r = await updateProject(id, rec); setProjects(projects.map(x=>x.id===id?r:x)); }}
            onDelete={async (id)=>{ await deleteProject(id); setProjects(projects.filter(x=>x.id!==id)); }}
            fields={[{k:'name',label:'Name'},{k:'role',label:'Role'},{k:'startDate',label:'Start'},{k:'endDate',label:'End'},{k:'url',label:'URL'},{k:'skills',label:'Skills'}]}
          />
        </Section>
      )}

      {tab === 'Import' && (
        <Section title="Import from LinkedIn / Resume">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <textarea className="border rounded p-2" placeholder="Paste profile text" value={importText} onChange={e=>setImportText(e.target.value)} />
            <div className="flex items-center gap-2">
              <input className="border rounded p-2 flex-1" placeholder="LinkedIn Profile URL" value={importUrl} onChange={e=>setImportUrl(e.target.value)} />
              <button className="px-3 py-2 bg-indigo-600 text-white rounded" onClick={onImportUrl}>Preview</button>
            </div>
            <div className="flex items-center gap-2">
              <input type="file" accept=".pdf,.docx" onChange={e=>setImportFile(e.target.files?.[0]||null)} />
              <button className="px-3 py-2 bg-indigo-600 text-white rounded" onClick={()=>onImportFile(importFile?.name.toLowerCase().endswith('.pdf')?'pdf':'docx')} disabled={!importFile}>Preview</button>
            </div>
            <div>
              <button className="px-3 py-2 bg-indigo-600 text-white rounded" onClick={onImportText} disabled={!importText}>Preview Text</button>
            </div>
          </div>
          {importPreview && (
            <div className="mt-4">
              <pre className="bg-gray-50 p-3 rounded border overflow-auto max-h-96">{JSON.stringify(importPreview.preview, null, 2)}</pre>
              <div className="mt-4">
                <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={onApplyImport}>Apply to Profile</button>
              </div>
            </div>
          )}
        </Section>
      )}
    </div>
  );
};

interface Field { k: string; label: string; }

const RecordList: React.FC<{
  items: any[];
  fields: Field[];
  onCreate: (rec: any) => Promise<void|any>;
  onUpdate: (id: number, rec: any) => Promise<void|any>;
  onDelete: (id: number) => Promise<void>;
}> = ({ items, fields, onCreate, onUpdate, onDelete }) => {
  const [draft, setDraft] = useState<any>({});
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
        {fields.map(f => (
          <input key={f.k} className="border rounded p-2" placeholder={f.label} value={(draft[f.k]??'').toString()} onChange={e=>setDraft({...draft,[f.k]: e.target.value})} />
        ))}
      </div>
      <button className="px-3 py-2 bg-indigo-600 text-white rounded" onClick={async ()=>{ const r = await onCreate(draft); if(r){ setDraft({}); } }}>Add</button>

      <ul className="mt-6 space-y-3">
        {items.map(item => (
          <li key={item.id} className="border rounded p-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {fields.map(f => (
                <input key={f.k} className="border rounded p-2" value={(item[f.k]??'').toString()} onChange={e=>{ const v = e.target.value; item[f.k]=v; }} />
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <button className="px-3 py-1 bg-emerald-600 text-white rounded" onClick={()=>onUpdate(item.id, item)}>Save</button>
              <button className="px-3 py-1 bg-rose-600 text-white rounded" onClick={()=>onDelete(item.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProfilePage;

