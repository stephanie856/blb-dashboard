import React, { useState, useEffect } from 'react';
import { Upload, FileText, Calendar, Printer, RotateCcw, Cloud, LogOut, RefreshCw, Info, AlertCircle, MessageCircle, ExternalLink, ChevronLeft, Clock, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

// --- 1. TYPES & DEFS ---
const STORAGE_KEY = 'neuroreddit_dashboard_data';
const HISTORY_KEY = 'neuroreddit_analysis_history';

export interface Metadata {
  chapter_number: number;
  analyzed_at: string;
  analysis_id: string;
  time_filter: string;
  subreddits: string[];
}

export interface Theme {
  name: string;
  description: string;
  total_posts: number;
  by_subreddit: Record<string, number>;
  sentiment_breakdown: Record<string, number>;
  top_posts: Array<{ title: string; upvotes: number; subreddit: string; url: string }>;
  quotes: string[];
  wordcloud_path: string;
}

export interface AnalysisData {
  metadata: Metadata;
  themes: Theme[];
}

// --- 2. SAMPLE DATA (For Reset) ---
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

// --- 3. COMPONENTS ---
const ThemeCard: React.FC<{ theme: Theme; totalPostsInChapter: number }> = ({ theme, totalPostsInChapter }) => {
  const percentage = Math.round((theme.total_posts / totalPostsInChapter) * 100);
  const sentimentData = Object.entries(theme.sentiment_breakdown).map(([key, value]) => ({
    name: key.replace('_', ' '),
    value: value
  }));
  const COLORS = ['#818cf8', '#f472b6', '#34d399', '#fbbf24', '#94a3b8'];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-slate-900">{theme.name}</h3>
          <p className="text-slate-500 text-sm mt-1">{theme.description}</p>
        </div>
        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
          {percentage}% of Discussion
        </span>
      </div>
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="h-48 w-full">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Sentiment</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sentimentData}>
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} />
                <RechartsTooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {sentimentData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Key Verbatims</h4>
            <div className="space-y-3">
              {theme.quotes.map((quote, i) => (
                <blockquote key={i} className="pl-4 border-l-2 border-indigo-300 italic text-slate-600 text-sm">"{quote}"</blockquote>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 4. MAIN APP ---
const App: React.FC = () => {
  // State
  const [view, setView] = useState<'home' | 'dashboard'>('home');
  const [currentData, setCurrentData] = useState<AnalysisData>(SAMPLE_DATA);
  const [history, setHistory] = useState<AnalysisData[]>([]);

  // Init History on Load
  useEffect(() => {
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    } else {
      setHistory([SAMPLE_DATA]); // Start with sample in history
    }
  }, []);

  const addToHistory = (newData: AnalysisData) => {
    const updatedHistory = [newData, ...history.filter(h => h.metadata.analysis_id !== newData.metadata.analysis_id)];
    setHistory(updatedHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          if (!json.metadata || !json.themes) throw new Error("Invalid Format");
          setCurrentData(json);
          addToHistory(json);
          setView('dashboard');
        } catch (err) { alert('Invalid JSON file. Ensure it matches the NeuroReddit format.'); }
      };
      reader.readAsText(file);
    }
  };

  const loadFromHistory = (data: AnalysisData) => {
    setCurrentData(data);
    setView('dashboard');
  };

  // --- VIEWS ---

  if (view === 'home') {
    return (
      <div className="min-h-screen bg-stone-50 text-slate-900 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4 pt-10">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto shadow-xl shadow-indigo-200">NR</div>
            <h1 className="text-4xl font-extrabold tracking-tight">NeuroReddit Research Archive</h1>
            <p className="text-slate-500 max-w-lg mx-auto">Select a previously analyzed chapter or upload a new JSON analysis file to generate a dashboard.</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-4">
             <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                <Upload size={24} />
             </div>
             <h3 className="text-lg font-bold">Upload New Analysis</h3>
             <label className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all cursor-pointer shadow-lg shadow-indigo-100">
                <span>Select JSON File</span>
                <input type="file" className="hidden" accept=".json" onChange={handleFileUpload} />
            </label>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Clock size={16} /> Recent History
            </h3>
            <div className="grid gap-4">
                {history.map((item, idx) => (
                    <button key={idx} onClick={() => loadFromHistory(item)} className="group flex items-center justify-between p-5 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all text-left">
                        <div>
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md mb-2 inline-block">Chapter {item.metadata.chapter_number}</span>
                            <h4 className="font-bold text-slate-900">{item.metadata.analysis_id}</h4>
                            <p className="text-xs text-slate-500 mt-1">{new Date(item.metadata.analyzed_at).toLocaleDateString()} • {item.themes.length} Themes Identified</p>
                        </div>
                        <ChevronLeft size={20} className="rotate-180 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                    </button>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard View
  const totalPostsInChapter = currentData.themes.reduce((acc, theme) => acc + theme.total_posts, 0);
  
  return (
    <div className="min-h-screen bg-stone-50 text-slate-900 pb-20">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
             <div className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors text-sm font-bold gap-1">
                <ChevronLeft size={16} /> Back to Archive
             </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">NR</div>
             <span className="font-bold text-slate-900">Chapter {currentData.metadata.chapter_number}</span>
          </div>
          <div className="flex items-center gap-2">
             <button onClick={() => window.print()} className="p-2 text-slate-400 hover:text-slate-600"><Printer size={20} /></button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <section className="mb-12">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-2">Analysis Insights</h2>
            <div className="flex gap-4 text-sm text-slate-500">
                <span>{new Date(currentData.metadata.analyzed_at).toLocaleDateString()}</span>
                <span>•</span>
                <span>{currentData.metadata.subreddits.length} subreddits mapped</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase">Mentions</p>
                    <p className="text-3xl font-bold text-indigo-600">{totalPostsInChapter.toLocaleString()}</p>
                </div>
                 <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase">Themes</p>
                    <p className="text-3xl font-bold text-teal-600">{currentData.themes.length}</p>
                </div>
            </div>
        </section>

        <section className="space-y-8">
            {currentData.themes.map((theme, index) => (
                <ThemeCard key={index} theme={theme} totalPostsInChapter={totalPostsInChapter} />
            ))}
        </section>
      </main>
    </div>
  );
};

export default App;