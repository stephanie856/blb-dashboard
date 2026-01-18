
import React, { useState, useEffect, useCallback } from 'react';
import { Upload, FileText, Calendar, Filter, Printer, Save, RotateCcw, Cloud, CloudOff, LogOut, RefreshCw, Info, AlertCircle } from 'lucide-react';
import { AnalysisData } from './types';
import ThemeCard from './components/ThemeCard';
import { GoogleDriveSync } from './utils/googleDrive';

const STORAGE_KEY = 'neuroreddit_dashboard_data';

const SAMPLE_DATA: AnalysisData = {
  metadata: {
    chapter_number: 7,
    analyzed_at: new Date().toISOString(),
    analysis_id: "chapter_7_neurodivergent_lived_experience",
    time_filter: "Past Year",
    subreddits: ["ADHDwomen", "ADHD", "autism", "neurodiversity", "AuDHDWomen"]
  },
  themes: [
    {
      name: "Functional Freeze",
      description: "A state of being technically capable of tasks but physically or emotionally unable to initiate them, often described as 'buffering'.",
      total_posts: 342,
      by_subreddit: { "ADHDwomen": 127, "ADHD": 89, "AuDHDWomen": 64, "neurodiversity": 42, "autism": 20 },
      sentiment_breakdown: { inspirational: 25, fed_up: 160, seeking_advice: 87, supportive: 50, neutral: 20 },
      top_posts: [{ title: "Staring at laundry loop.", upvotes: 2450, subreddit: "ADHDwomen", url: "https://reddit.com" }],
      quotes: ["The shame of being 'lazy' when you are actually exhausted."],
      wordcloud_path: ""
    }
  ]
};

const App: React.FC = () => {
  const [data, setData] = useState<AnalysisData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : SAMPLE_DATA;
  });

  const [isHighContrast, setIsHighContrast] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isDataCustom, setIsDataCustom] = useState(() => !!localStorage.getItem(STORAGE_KEY));

  useEffect(() => {
    GoogleDriveSync.init();
  }, []);

  // Sync effect
  useEffect(() => {
    if (data !== SAMPLE_DATA) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setIsDataCustom(true);
      if (isAuthorized) {
        const timer = setTimeout(() => handleCloudSave(), 2000); // Debounce
        return () => clearTimeout(timer);
      }
    }
  }, [data, isAuthorized]);

  const handleCloudSave = async () => {
    setSyncStatus('syncing');
    try {
      const fileId = await GoogleDriveSync.findSyncFile();
      await GoogleDriveSync.uploadData(data, fileId || undefined);
      setSyncStatus('synced');
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
    }
  };

  const handleLogin = async () => {
    try {
      await GoogleDriveSync.authenticate();
      setIsAuthorized(true);
      setSyncStatus('syncing');
      const fileId = await GoogleDriveSync.findSyncFile();
      if (fileId) {
        const cloudData = await GoogleDriveSync.downloadData(fileId);
        if (confirm("Found saved data in Google Drive. Load it?")) {
          setData(cloudData);
        }
      }
      setSyncStatus('synced');
    } catch (err) {
      alert("Auth failed or was cancelled.");
    }
  };

  const handleLogout = () => {
    (window as any).gapi.client.setToken(null);
    setIsAuthorized(false);
    setSyncStatus('idle');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          setData(json);
        } catch (err) { alert('Invalid JSON file.'); }
      };
      reader.readAsText(file);
    }
  };

  const resetToSample = () => {
    if (confirm("Reset to sample data?")) {
      localStorage.removeItem(STORAGE_KEY);
      setData(SAMPLE_DATA);
      setIsDataCustom(false);
    }
  };

  const totalPostsInChapter = data.themes.reduce((acc, theme) => acc + theme.total_posts, 0);

  return (
    <div className={`min-h-screen pb-20 transition-colors duration-300 ${isHighContrast ? 'bg-black text-white' : 'bg-stone-50 text-slate-900'}`}>
      <header className={`sticky top-0 z-50 border-b shadow-sm no-print ${isHighContrast ? 'bg-zinc-900 border-zinc-700' : 'bg-white/80 backdrop-blur-md border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">NR</div>
            <div>
              <h1 className="text-lg font-bold leading-none">NeuroReddit</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Research Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
              syncStatus === 'synced' ? 'bg-green-100 text-green-700' :
              syncStatus === 'syncing' ? 'bg-blue-100 text-blue-700' :
              syncStatus === 'error' ? 'bg-red-100 text-red-700' :
              'bg-slate-100 text-slate-500'
            }`}>
              {syncStatus === 'syncing' && <RefreshCw size={12} className="animate-spin" />}
              {syncStatus === 'synced' && <Save size={12} />}
              {syncStatus === 'error' && <AlertCircle size={12} />}
              {syncStatus === 'idle' && <CloudOff size={12} />}
              <span>{isAuthorized ? `Cloud ${syncStatus}` : 'Local Only'}</span>
            </div>

            {isAuthorized ? (
              <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg" title="Sign out">
                <LogOut size={18} />
              </button>
            ) : (
              <button onClick={handleLogin} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600">
                <Cloud size={16} className="text-blue-500" />
                <span className="hidden lg:inline">Sync Drive</span>
              </button>
            )}

            <button onClick={() => setIsHighContrast(!isHighContrast)} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg">
              <Info size={20} />
            </button>

            <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-all cursor-pointer shadow-lg shadow-indigo-200">
              <Upload size={18} />
              <span className="hidden sm:inline">Load JSON</span>
              <input type="file" className="hidden" accept=".json" onChange={handleFileUpload} />
            </label>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <section className="mb-12 print-break-inside-avoid">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm tracking-widest uppercase">
                <FileText size={16} /> Chapter {data.metadata.chapter_number}
              </div>
              <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">Analysis Insights</h2>
              <div className="flex flex-wrap items-center gap-4 text-slate-500 text-sm">
                <span className="flex items-center gap-1.5"><Calendar size={14} /> Analyzed: {new Date(data.metadata.analyzed_at).toLocaleDateString()}</span>
                <span className="flex items-center gap-1.5 bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full text-xs font-semibold">{data.metadata.subreddits.length} subreddits mapped</span>
              </div>
            </div>
            <div className="flex items-center gap-3 no-print">
              <button onClick={() => window.print()} className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all"><Printer size={20} /></button>
              {isDataCustom && <button onClick={resetToSample} className="p-2.5 rounded-xl border border-rose-100 bg-white hover:bg-rose-50 text-rose-500 transition-all"><RotateCcw size={20} /></button>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-6 rounded-2xl border ${isHighContrast ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-100 shadow-sm'}`}>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-1">Mentions</p>
              <p className="text-3xl font-bold text-indigo-600">{totalPostsInChapter.toLocaleString()}</p>
            </div>
            <div className={`p-6 rounded-2xl border ${isHighContrast ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-100 shadow-sm'}`}>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-1">Subreddits</p>
              <p className="text-3xl font-bold text-teal-600">{data.metadata.subreddits.length}</p>
            </div>
            <div className={`p-6 rounded-2xl border ${isHighContrast ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-100 shadow-sm'}`}>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-1">Sync</p>
              <p className={`text-3xl font-bold ${isAuthorized ? 'text-green-500' : 'text-slate-400'}`}>
                {isAuthorized ? 'Cloud' : 'Local'}
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          {data.themes.map((theme, index) => (
            <ThemeCard key={`${data.metadata.analysis_id}-${index}`} theme={theme} totalPostsInChapter={totalPostsInChapter} />
          ))}
        </section>
      </main>
    </div>
  );
};

export default App;
