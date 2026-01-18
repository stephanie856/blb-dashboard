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
            <div className="space-y-3