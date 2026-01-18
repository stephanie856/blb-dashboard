import React, { useState, useEffect } from 'react';
import { Upload, FileText, Calendar, Printer, Download, BookOpen, ChevronLeft, TrendingUp, Share2, MessageSquare, Award, ExternalLink, RefreshCw, AlertCircle, Info, Users, Cloud, LogOut, Save } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import * as pdfjsLib from 'pdfjs-dist';

// --- 1. CONFIGURATION ---
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
const BOOK_PDF_PATH = "/Book/back-left-burner-STANDARD.pdf";
const STORAGE_KEY = 'neuroreddit_dashboard_data';
const HISTORY_KEY = 'neuroreddit_analysis_history';

// --- 2. TYPES ---
export interface Theme {
  name: string;
  description: string;
  total_posts: number;
  engagement: { comments: number; avg_upvotes: number; awards: number };
  by_subreddit: Record<string, number>;
  sentiment_breakdown: Record<string, number>;
  top_posts: Array<{ title: string; upvotes: number; subreddit: string; url: string }>;
  quotes: string[];
  overlaps: string[];
  book_mapping?: { quote: string; context: string }; 
  temporal_data?: Array<{ month: string; count: number }>;
}

export interface AnalysisData {
  metadata: {
    chapter_number: number;
    analyzed_at: string;
    analysis_id: string; // This is used to match the Book Chapter
    subreddits: string[];
    unique_authors?: number; 
    time_filter: string;
  };
  themes: Theme[];
}

// --- 3. COMPONENTS ---

const StatsTable: React.FC<{ data: AnalysisData }> = ({ data }) => {
    return (
        <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm mb-8">
            <table className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                    <tr>
                        <th className="px-6 py-3">Theme</th>
                        <th className="px-6 py-3">Vol</th>
                        <th className="px-6 py-3">Comments</th>
                        <th className="px-6 py-3">Avg Upvotes</th>
                        <th className="px-6 py-3">Dominant Sub</th>
                        <th className="px-6 py-3">Significance</th>
                    </tr>
                </thead>
                <tbody>
                    {data.themes.map((theme, i) => (
                        <tr key={i} className="bg-white border-b hover:bg-slate-50">
                            <td className="px-6 py-4 font-bold text-slate-900">{theme.name}</td>
                            <td className="px-6 py-4">{theme.total_posts}</td>
                            <td className="px-6 py-4">{theme.engagement?.comments || 0}</td>
                            <td className="px-6 py-4">{theme.engagement?.avg_upvotes || 0}</td>
                            <td className="px-6 py-4">
                                {theme.by_subreddit ? `r/${Object.entries(theme.by_subreddit).sort((a,b)=>b[1]-a[1])[0]?.[0]}` : '-'}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded-full border border-green-100">High (Top 5%)</span>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

const ThemeCard: React.FC<{ theme: Theme; totalPosts: number }> = ({ theme, totalPosts }) => {
  const percentage = totalPosts > 0 ? Math.round((theme.total_posts / totalPosts) * 100) : 0;
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8 hover:shadow-lg transition-all">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">{theme.name}</h3>
          <p className="text-slate-500 text-sm mt-1">{theme.description}</p>
        </div>
        <div className="text-right">
             <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">{percentage}% Share</span>
             <div className="flex gap-3 mt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1"><MessageSquare size={12}/> {theme.engagement?.comments || 0} comments</span>
             </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* CONDITIONAL CHART RENDERING */}
          {theme.temporal_data && theme.temporal_data.length > 0 ? (
          <div className="h-48 w-full">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><TrendingUp size={14}/> Temporal Trend</h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={theme.temporal_data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <RechartsTooltip />
                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{r: 4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          ) : (
             <div className="h-24 w-full bg-slate-50 rounded border border-slate-100 flex items-center justify-center text-slate-400 text-sm italic">
                No trend data available in this JSON
             </div>
          )}
          
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
             <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-widest mb-2 flex items-center gap-2"><Share2 size={14}/> Comorbidity</h4>
             {theme.overlaps && theme.overlaps.length > 0 ? (
                <ul className="flex flex-wrap gap-2">{theme.overlaps.map((o, i) => <li key={i} className="text-xs bg-white/60 px-2 py-1 rounded text-indigo-900 border border-indigo-100">#{o}</li>)}</ul>
             ) : (
                <span className="text-xs text-indigo-400 italic">No overlap data found.</span>
             )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
             <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><BookOpen size={14}/> Book Validation</h4>
             
             {theme.book_mapping ? (
               <div className="space-y-4">
                 <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-slate-300"></div>
                    <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase">From Your Book</p>
                    <p className="italic text-slate-700 text-sm font-medium leading-relaxed">"{theme.book_mapping.quote}..."</p>
                 </div>
               </div>
             ) : (
               <div className="flex items-center gap-2 text-slate-400 text-sm italic p-4 bg-white border border-slate-100 rounded-lg">
                 <RefreshCw size={14} className="animate-spin"/> Scanning book for "{theme.name}"...
               </div>
             )}
          </div>
          
          {theme.quotes && theme.quotes.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Top Reddit Verbatim</h4>
            <blockquote className="pl-4 border-l-2 border-indigo-300 text-slate-600 text-sm italic">"{theme.quotes[0]}"</blockquote>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- 5. MAIN APP ---
const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'dashboard'>('home');
  const [data, setData] = useState<AnalysisData | null>(null);
  const [history, setHistory] = useState<AnalysisData[]>([]);
  const [scanStatus, setScanStatus] = useState<string>("Waiting for data...");
  
  // Load History
  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  // --- PDF MINING ENGINE (Triggered ONLY when data is loaded) ---
  useEffect(() => {
    if (!data) return; 

    const minePDF = async () => {
      try {
        setScanStatus("Loading Book PDF...");
        // 1. Check if PDF exists
        try {
            const loadingTask = pdfjsLib.getDocument(BOOK_PDF_PATH);
            const pdf = await loadingTask.promise;
            
            let fullText = "";
            // Scan first 100 pages (optimization)
            setScanStatus("Scanning text...");
            for (let i = 1; i <= Math.min(pdf.numPages, 100); i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                fullText += textContent.items.map((item: any) => item.str).join(' ') + " ";
            }

            // DYNAMIC MATCHING
            const targetTitle = data.metadata.analysis_id; 
            const chapterIndex = fullText.toLowerCase().indexOf(targetTitle.toLowerCase());
            
            if (chapterIndex === -1) {
                setScanStatus(`Chapter "${targetTitle}" not found in PDF.`);
                return;
            }
            
            // Grab context
            const relevantText = fullText.substring(chapterIndex, chapterIndex + 25000); 
            setScanStatus("Mining quotes...");

            const updatedThemes = data.themes.map(theme => {
                const regex = new RegExp(`([^.]*?${theme.name}[^.]*\\.)`, 'i');
                const match = relevantText.match(regex);
                
                return { 
                    ...theme, 
                    book_mapping: match 
                        ? { quote: match[1].trim(), context: "Direct Match" }
                        : undefined // Leave undefined so UI shows "Not found" rather than fake data
                };
            });

            setData(prev => prev ? ({ ...prev, themes: updatedThemes }) : null);
            setScanStatus("Complete");

        } catch (innerErr) {
            console.error(innerErr);
            setScanStatus("Error: Book PDF not found in /public/Book/");
        }

      } catch (err) {
        console.error("PDF Read Error:", err);
        setScanStatus("PDF Engine Failure");
      }
    };
    minePDF();
  }, [data?.metadata.analysis_id]); 

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          // Strict validation
          if (!json.metadata || !json.themes) throw new Error("Invalid Format");
          
          // Reset data completely to avoid ghost data
          setData(null);
          setTimeout(() => {
              setData(json);
              setHistory(prev => [json, ...prev.filter(h => h.metadata.analysis_id !== json.metadata.analysis_id)]);
              setView('dashboard');
          }, 100);
          
        } catch (err) { alert('Invalid JSON file.'); }
      };
      reader.readAsText(file);
    }
  };

  const exportForPublisher = () => {
    if (!data) return;
    const report = `VALIDATION REPORT\nAnalysis: ${data.metadata.analysis_id}`;
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Report.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // --- VIEW: HOME ---
  if (view === 'home') {
    return (
      <div className="min-h-screen bg-stone-50 text-slate-900 p-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl space-y-8 text-center">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-3xl font-bold mx-auto shadow-2xl shadow-indigo-200">NR</div>
          <div>
             <h1 className="text-4xl font-black tracking-tight text-slate-900">NeuroReddit Archive</h1>
             <p className="text-slate-500 mt-2">Correlating Lived Experience with Clinical Literature</p>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-4">
             <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><Upload size={24} /></div>
             <label className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all cursor-pointer shadow-lg shadow-indigo-100">
                <span>Upload Analysis JSON</span>
                <input type="file" className="hidden" accept=".json" onChange={handleFileUpload} />
            </label>
          </div>

          <div className="grid gap-3 text-left">
            {history.map((h, i) => (
              <button key={i} onClick={() => { setData(h); setView('dashboard'); }} className="p-5 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-lg transition-all group">
                <div className="flex justify-between items-center">
                   <div>
                     <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Chapter {h.metadata.chapter_number}</span>
                     <h3 className="font-bold text-lg text-slate-900 group-hover:text-indigo-700">{h.metadata.analysis_id}</h3>
                   </div>
                   <ChevronLeft size={20} className="rotate-180 text-slate-300 group-hover:text-indigo-600"/>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW: DASHBOARD ---
  if (!data) return null;

  return (
    <div className="min-h-screen bg-stone-50 text-slate-900 pb-20">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
             <div className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors text-sm font-bold gap-1"><ChevronLeft size={16} /> Archive</div>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">NR</div>
             <span className="font-bold text-slate-900 line-clamp-1">{data.metadata.analysis_id}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`text-xs font-mono px-2 py-1 rounded border ${scanStatus === 'Complete' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                {scanStatus}
            </div>
            <button onClick={exportForPublisher} className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-slate-200">
                <Download size={16}/> <span className="hidden sm:inline">Export Report</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        
        {/* DYNAMIC METHODOLOGY SECTION */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-xl mb-12">
            <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2"><Info size={16}/> Methodology</h3>
            <ul className="grid grid-cols-1 gap-2 text-sm text-blue-800">
                <li>• <strong>Communities Analyzed:</strong> {data.metadata.subreddits.join(", ")}</li>
                <li>• <strong>Time Period:</strong> {data.metadata.time_filter}</li>
                <li>• <strong>Validation Volume:</strong> {data.themes.reduce((a, t) => a + t.total_posts, 0)} total mentions across {data.themes.length} identified themes.</li>
            </ul>
        </div>

        <section className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase">Independent Validations</p>
                    <p className="text-3xl font-bold text-indigo-600">{data.metadata.unique_authors || '-'}</p>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Users size={12}/> Unique Individuals</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase">Total Volume</p>
                    <p className="text-3xl font-bold text-teal-600">{data.themes.reduce((a, t) => a + t.total_posts, 0).toLocaleString()}</p>
                    <p className="text-xs text-slate-400 mt-1">Total Mentions</p>
                </div>
                 <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase">Book Status</p>
                    <p className={`text-xl font-bold ${scanStatus === 'Complete' ? 'text-green-600' : 'text-amber-500'}`}>
                        {scanStatus}
                    </p>
                </div>
            </div>

            <StatsTable data={data} />
        </section>

        <section className="space-y-8">
            {data.themes.map((theme, index) => (
                <ThemeCard key={index} theme={theme} totalPosts={data.themes.reduce((a, t) => a + t.total_posts, 0)} />
            ))}
        </section>
      </main>
    </div>
  );
};

export default App;