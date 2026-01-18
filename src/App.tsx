import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Upload, Download, BookOpen, ChevronLeft, TrendingUp, Share2, MessageSquare, 
  Award, ExternalLink, Info, Users, Printer } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Cell, CartesianGrid, PieChart, Pie } from 'recharts';

// --- TYPES ---
interface Theme {
  name: string;
  description: string;
  total_posts: number;
  engagement?: { 
    comments: number; 
    avg_upvotes: number; 
    awards: number;
  };
  by_subreddit: Record<string, number>;
  sentiment_breakdown: Record<string, number>;
  top_posts: Array<{ 
    title: string; 
    upvotes: number; 
    subreddit: string; 
    url: string;
  }>;
  quotes: string[];
  overlaps?: string[];
  temporal_data?: Array<{ month: string; count: number }>;
  csv_path?: string;
  wordcloud_path?: string;
  // ADD THIS LINE BELOW:
  related_chapters?: Array<{ chapter_name: string; chapter_quote: string; }>; 
  book_quotes?: Array<{
    context?: string;
    chapter_name?: string;
    quote?: string;
    chapter_quote?: string;
  }>;
  functional_type?: string;
}

interface AnalysisData {
  metadata: {
    chapter_number: number;
    analyzed_at: string;
    analysis_id: string;
    subreddits: string[];
    unique_authors?: number;
    time_filter: string;
  };
  themes: Theme[];
}

// Theme crossover type for distribution chart
interface ThemeCrossover {
  themes: string[];
  count: number;
  percentage: number;
}

// --- LOCAL STORAGE KEYS ---
const HISTORY_KEY = 'neuroreddit_analysis_history';

// --- SAMPLE DATA (for demonstration) ---
const SAMPLE_DATA: AnalysisData = {
  metadata: {
    chapter_number: 7,
    analyzed_at: "2025-01-17",
    analysis_id: "Functional Freeze",
    time_filter: "year",
    subreddits: ["ADHDwomen", "ADHD", "autism", "neurodiversity", "AuDHDWomen", "Alexithymia", "ADHDers"],
    unique_authors: 892
  },
  themes: [
    {
      name: "functional-freeze",
      description: "Appearing functional while emotionally/mentally shut down",
      total_posts: 342,
      engagement: { comments: 1240, avg_upvotes: 85, awards: 12 },
      by_subreddit: { 
        "ADHDwomen": 127, 
        "ADHD": 89, 
        "autism": 64, 
        "neurodiversity": 42, 
        "AuDHDWomen": 20 
      },
      sentiment_breakdown: { 
        "fed_up": 160, 
        "seeking_advice": 87, 
        "supportive": 50, 
        "inspirational": 25,
        "neutral": 20
      },
      top_posts: [
        { 
          title: "I'm not lazy, I'm in a functional coma", 
          upvotes: 456, 
          subreddit: "ADHDwomen", 
          url: "https://reddit.com/r/ADHDwomen/example" 
        },
        { 
          title: "Survival mode is not the same as living", 
          upvotes: 328, 
          subreddit: "ADHD", 
          url: "https://reddit.com/r/ADHD/example" 
        },
        { 
          title: "Going through the motions but feeling nothing", 
          upvotes: 287, 
          subreddit: "autism", 
          url: "https://reddit.com/r/autism/example" 
        }
      ],
      quotes: [
        "It's not coldness, it's freeze. I'm not lazy, I'm in a functional coma.",
        "My body learned too well. It doesn't get scared anymore. It just shuts down.",
        "I look fine from the outside, but inside I'm running on low power mode constantly."
      ],
      overlaps: ["ahedonia (45%)", "dissociation (38%)", "burnout (30%)"],
      temporal_data: [
        { month: 'Jan', count: 25 },
        { month: 'Feb', count: 28 },
        { month: 'Mar', count: 32 },
        { month: 'Apr', count: 29 },
        { month: 'May', count: 35 },
        { month: 'Jun', count: 30 },
        { month: 'Jul', count: 28 },
        { month: 'Aug', count: 26 },
        { month: 'Sep', count: 31 },
        { month: 'Oct', count: 33 },
        { month: 'Nov', count: 22 },
        { month: 'Dec', count: 23 }
      ]
    },
    {
      name: "ahedonia",
      description: "Inability to experience pleasure from previously enjoyable activities",
      total_posts: 156,
      engagement: { comments: 450, avg_upvotes: 110, awards: 5 },
      by_subreddit: { 
        "ADHDwomen": 48, 
        "ADHD": 38, 
        "autism": 30, 
        "neurodiversity": 25, 
        "Alexithymia": 15 
      },
      sentiment_breakdown: { 
        "fed_up": 87, 
        "seeking_advice": 27, 
        "supportive": 25,
        "inspirational": 10,
        "neutral": 7
      },
      top_posts: [
        { 
          title: "Nothing brings me joy anymore and I don't know how to fix it", 
          upvotes: 380, 
          subreddit: "ADHDwomen", 
          url: "https://reddit.com/r/ADHDwomen/example2" 
        },
        { 
          title: "Does anyone else feel emotionally numb most of the time?", 
          upvotes: 331, 
          subreddit: "ADHD", 
          url: "https://reddit.com/r/ADHD/example2" 
        }
      ],
      quotes: [
        "Small pleasures barely register. Joy only punches through in extreme doses.",
        "I'm not sad, I'm just... flat. Like someone turned down the volume on everything.",
        "It's like living in grayscale when everyone else sees in color."
      ],
      overlaps: ["functional-freeze (60%)", "depression (42%)", "burnout (35%)"],
      temporal_data: [
        { month: 'Jan', count: 12 },
        { month: 'Feb', count: 14 },
        { month: 'Mar', count: 15 },
        { month: 'Apr', count: 13 },
        { month: 'May', count: 16 },
        { month: 'Jun', count: 14 },
        { month: 'Jul', count: 12 },
        { month: 'Aug', count: 11 },
        { month: 'Sep', count: 13 },
        { month: 'Oct', count: 15 },
        { month: 'Nov', count: 10 },
        { month: 'Dec', count: 11 }
      ]
    },
    {
      name: "invisibility",
      description: "Being overlooked or treated as non-essential despite being present",
      total_posts: 218,
      engagement: { comments: 687, avg_upvotes: 92, awards: 8 },
      by_subreddit: { 
        "ADHDwomen": 89, 
        "ADHD": 52, 
        "neurodiversity": 41, 
        "autism": 24, 
        "AuDHDWomen": 12 
      },
      sentiment_breakdown: { 
        "fed_up": 98, 
        "seeking_advice": 45, 
        "supportive": 38,
        "inspirational": 20,
        "neutral": 17
      },
      top_posts: [
        { 
          title: "I feel like a ghost in my own friend group", 
          upvotes: 412, 
          subreddit: "ADHDwomen", 
          url: "https://reddit.com/r/ADHDwomen/example3" 
        },
        { 
          title: "Always the afterthought, never the first choice", 
          upvotes: 356, 
          subreddit: "ADHD", 
          url: "https://reddit.com/r/ADHD/example3" 
        }
      ],
      quotes: [
        "I'm liked in the way reliable tools are liked. Helpful. Pleasant. Convenient. Not oriented toward.",
        "Plans still happen if I'm unavailable. That tells me everything I need to know.",
        "I'm the elephant in the room. Just quiet. Well-dressed. Well-spoken. And utterly unseen."
      ],
      overlaps: ["deprioritized (52%)", "masking (41%)", "RSD (38%)"]
    }
  ]
};

// --- UTILITY FUNCTIONS ---
const calculateSignificance = (posts: number, avgEngagement: number): string => {
  if (posts > 200 || avgEngagement > 100) return "High (Top 5%)";
  if (posts > 100 || avgEngagement > 50) return "Medium (Top 20%)";
  return "Moderate";
};

const getSignificanceColor = (significance: string): string => {
  if (significance.startsWith("High")) return "text-green-600 bg-green-50 border-green-200";
  if (significance.startsWith("Medium")) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-slate-600 bg-slate-50 border-slate-200";
};

// --- COMPONENTS ---

// Theme Distribution & Overlap Chart
const ThemeDistributionChart: React.FC<{ data: AnalysisData }> = ({ data }) => {
  const totalPosts = data.themes.reduce((sum, t) => sum + t.total_posts, 0);
  // Calculate individual theme percentages
  const themeDistribution = data.themes.map(theme => ({
    name: theme.name.replace('-', ' '),
    posts: theme.total_posts,
    percentage: Math.round((theme.total_posts / totalPosts) * 100)
  }));

  // Calculate crossover data from overlaps
  const crossoverData: ThemeCrossover[] = [];
  data.themes.forEach(theme => {
    if (theme.overlaps && theme.overlaps.length > 0) {
      theme.overlaps.forEach(overlap => {
        // Extract theme name and percentage from format "theme-name (45%)"
        const match = overlap.match(/^(.+?)\s*\((\d+)%\)$/);
        if (match) {
          const [, otherThemeName, percentage] = match;
          const crossoverPercentage = parseInt(percentage);
          // Calculate actual post count based on percentage of current theme's posts
          const estimatedCrossoverPosts = Math.round((theme.total_posts * crossoverPercentage) / 100);
          crossoverData.push({
            themes: [theme.name, otherThemeName.trim()],
            count: estimatedCrossoverPosts,
            percentage: crossoverPercentage
          });
        }
      });
    }
  });
  // Sort crossover by count descending
  const sortedCrossover = crossoverData.sort((a, b) => b.count - a.count);
  const THEME_COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-900 mb-2">Theme Distribution & Overlap Analysis</h3>
        <p className="text-sm text-slate-600">
          Out of <span className="font-bold text-indigo-600">{totalPosts.toLocaleString()}</span> total posts scraped across all themes
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT: Individual Theme Distribution */}
        <div>
          <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <TrendingUp size={16} />
            Individual Theme Breakdown
          </h4>
          {/* Visual Bar Chart */}
          <div className="space-y-3 mb-6">
            {themeDistribution.map((theme, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-semibold text-slate-700 capitalize">
                    {theme.name}
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {theme.percentage}% ({theme.posts.toLocaleString()} posts)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${theme.percentage}%`,
                      backgroundColor: THEME_COLORS[index % THEME_COLORS.length]
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          {/* Pie Chart Alternative */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={themeDistribution}
                  dataKey="posts"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  labelLine={true}
                >
                  {themeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={THEME_COLORS[index % THEME_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value: number) => [`${value.toLocaleString()} posts`, 'Volume']}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* RIGHT: Theme Crossover Analysis */}
        <div>
          <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Share2 size={16} />
            Theme Crossover (Co-occurrence)
          </h4>
          {sortedCrossover.length > 0 ? (
            <>
              <div className="space-y-4 mb-6">
                {sortedCrossover.slice(0, 5).map((crossover, index) => (
                  <div key={index} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xs font-bold text-indigo-600 capitalize">
                          {crossover.themes[0].replace('-', ' ')}
                        </span>
                        <span className="text-slate-400">×</span>
                        <span className="text-xs font-bold text-pink-600 capitalize">
                          {crossover.themes[1].replace('-', ' ')}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-slate-900">
                        {crossover.percentage}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full transition-all duration-500"
                          style={{ width: `${crossover.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        ~{crossover.count.toLocaleString()} posts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Summary Stats */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h5 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2">
                  Key Insight
                </h5>
                <p className="text-sm text-indigo-800 leading-relaxed">
                  <span className="font-bold">
                    {sortedCrossover[0]?.percentage}%
                  </span> of posts discussing{' '}
                  <span className="font-semibold capitalize">
                    {sortedCrossover[0]?.themes[0].replace('-', ' ')}
                  </span>{' '}
                  also mentioned{' '}
                  <span className="font-semibold capitalize">
                    {sortedCrossover[0]?.themes[1].replace('-', ' ')}
                  </span>
                  , indicating strong thematic correlation.
                </p>
              </div>
            </>
          ) : (
            <div className="h-64 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-6">
              <Share2 size={32} className="mb-3 opacity-50" />
              <p className="text-sm text-center">
                No crossover data available in this analysis.
                <br />
                <span className="text-xs">
                  Crossover is calculated from theme overlap percentages.
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Bottom Summary */}
      <div className="mt-6 pt-6 border-t border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Themes Analyzed</p>
            <p className="text-2xl font-bold text-slate-900">{data.themes.length}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Posts</p>
            <p className="text-2xl font-bold text-indigo-600">{totalPosts.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Theme Overlaps Detected</p>
            <p className="text-2xl font-bold text-pink-600">{sortedCrossover.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatsTable: React.FC<{ data: AnalysisData }> = ({ data }) => (
  <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm mb-8">
    <table className="w-full text-sm">
      <thead className="text-xs text-slate-700 uppercase bg-slate-50">
        <tr>
          <th className="px-6 py-3 text-left">Theme</th>
          <th className="px-6 py-3 text-left">Volume</th>
          <th className="px-6 py-3 text-left">Comments</th>
          <th className="px-6 py-3 text-left">Avg Upvotes</th>
          <th className="px-6 py-3 text-left">Top Community</th>
          <th className="px-6 py-3 text-left">Significance</th>
        </tr>
      </thead>
      <tbody>
        {data.themes.map((theme, i) => {
          const topSub = Object.entries(theme.by_subreddit)
            .sort((a, b) => b[1] - a[1])[0];
          const significance = calculateSignificance(
            theme.total_posts, 
            theme.engagement?.avg_upvotes || 0
          );
          
          return (
            <tr key={i} className="border-b hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 font-bold text-slate-900">{theme.name}</td>
              <td className="px-6 py-4">{theme.total_posts.toLocaleString()}</td>
              <td className="px-6 py-4">
                {theme.engagement?.comments?.toLocaleString() || 0}
              </td>
              <td className="px-6 py-4">{theme.engagement?.avg_upvotes || 0}</td>
              <td className="px-6 py-4 text-indigo-600">r/{topSub?.[0] || '-'}</td>
              <td className="px-6 py-4">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getSignificanceColor(significance)}`}>
                  {significance}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const ThemeCard: React.FC<{ theme: Theme; totalPosts: number }> = ({ theme, totalPosts }) => {
  const percentage = totalPosts > 0 ? Math.round((theme.total_posts / totalPosts) * 100) : 0;
  
  const sentimentData = Object.entries(theme.sentiment_breakdown).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value
  }));
  
  const SENTIMENT_COLORS = ['#818cf8', '#f472b6', '#34d399', '#fbbf24', '#94a3b8'];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8 hover:shadow-lg transition-all duration-300">
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-slate-50 to-white flex flex-wrap gap-4 justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="text-2xl font-bold text-slate-900 mb-2 capitalize">
            {theme.name.replace('-', ' ')}
          </h3>
          <p className="text-slate-600 text-sm leading-relaxed">{theme.description}</p>
        </div>
        <div className="text-right space-y-2">
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold inline-block">
            {percentage}% of Discussion
          </span>
          <div className="flex gap-3 text-xs text-slate-500 justify-end">
            <span className="flex items-center gap-1">
              <MessageSquare size={12} /> {theme.engagement?.comments?.toLocaleString() || 0}
            </span>
            <span className="flex items-center gap-1">
              <Award size={12} /> {theme.engagement?.awards || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: Charts & Stats */}
        <div className="space-y-8">
          
          {/* Temporal Trend */}
          {theme.temporal_data && theme.temporal_data.length > 0 ? (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <TrendingUp size={14} /> Temporal Trend (12 Months)
              </h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={theme.temporal_data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="month" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    stroke="#94a3b8"
                  />
                  <YAxis 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    stroke="#94a3b8"
                  />
                  <RechartsTooltip
                    contentStyle={{ 
                      borderRadius: '8px', 
                      border: '1px solid #e2e8f0', 
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#6366f1" 
                    strokeWidth={2} 
                    dot={{ r: 4, fill: '#6366f1' }} 
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 text-sm">
              No temporal data available
            </div>
          )}

          {/* Sentiment Distribution */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Sentiment Distribution
            </h4>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={sentimentData}>
                <XAxis 
                  dataKey="name" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  stroke="#94a3b8"
                />
                <YAxis 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  stroke="#94a3b8"
                />
                <RechartsTooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[index % SENTIMENT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Theme Overlap */}
          {theme.overlaps && theme.overlaps.length > 0 && (
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
              <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Share2 size={14} /> Theme Overlap / Comorbidity
              </h4>
              <div className="flex flex-wrap gap-2">
                {theme.overlaps.map((overlap, i) => (
                  <span 
                    key={i} 
                    className="text-xs bg-white px-3 py-1 rounded-full text-indigo-800 border border-indigo-200 font-medium"
                  >
                    {overlap}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Subreddit Distribution */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Community Distribution
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(theme.by_subreddit)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([sub, count], i) => (
                  <div key={i} className="bg-slate-50 rounded-lg p-3 border border-slate-100 hover:border-indigo-200 transition-colors">
                    <p className="text-xs text-slate-500 mb-1">r/{sub}</p>
                    <p className="text-lg font-bold text-slate-900">{count}</p>
                  </div>
                ))}
            </div>
          </div>

          {/* Download CSV Button */}
          {theme.csv_path && (
            <a
              href={theme.csv_path}
              download
              className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors border border-slate-200"
            >
              <Download size={16} />
              Download Full Dataset (CSV)
            </a>
          )}
        </div>

        {/* RIGHT COLUMN: Content */}
        <div className="space-y-6">
          
          {/* Top Posts */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <TrendingUp size={14} /> Top Discussions
            </h4>
            <div className="space-y-2">
              {theme.top_posts.slice(0, 3).map((post, i) => (
                <a
                  key={i}
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group p-4 rounded-lg bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <p className="text-sm font-medium text-slate-800 group-hover:text-indigo-700 line-clamp-2 flex-1">
                      {post.title}
                    </p>
                    <ExternalLink 
                      size={14} 
                      className="text-slate-300 group-hover:text-indigo-500 flex-shrink-0 mt-1" 
                    />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="font-semibold text-indigo-600">r/{post.subreddit}</span>
                    <span>↑ {post.upvotes.toLocaleString()}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Community Quotes */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <MessageSquare size={14} /> Community Voices
            </h4>
            <div className="space-y-3">
              {theme.quotes.slice(0, 3).map((quote, i) => (
                <blockquote 
                  key={i} 
                  className="pl-4 border-l-4 border-indigo-300 text-slate-700 text-sm italic leading-relaxed"
                >
                  "{quote}"
                </blockquote>
              ))}
            </div>
          </div>

          {/* Word Cloud */}
          {/* Book Chapter Mapping */}
          {/* Book Validation Section */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <BookOpen size={14}/> Book Validation
            </h4>
            {theme.book_quotes && theme.book_quotes.length > 0 ? (
              <div className="space-y-4">
                {theme.book_quotes.map((quoteObj, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-400"></div>
                    <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase">
                      {quoteObj.context || quoteObj.chapter_name || 'From Your Book'}
                    </p>
                    <p className="italic text-slate-700 text-sm font-medium leading-relaxed">
                      "{quoteObj.quote || quoteObj.chapter_quote}"
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-400 text-sm italic p-4 bg-white border border-slate-100 rounded-lg">
                <Info size={14} />
                Book quote extraction pending - check PDF path in scraper
              </div>
            )}
          </div>

          {/* Word Cloud */}
          {theme.wordcloud_path && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Common Language Patterns
              </h4>
              <img 
                src={theme.wordcloud_path} 
                alt={`Word cloud for ${theme.name}`}
                className="w-full rounded-lg border border-slate-200 shadow-sm"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---
const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'dashboard'>('home');
  const [data, setData] = useState<AnalysisData | null>(null);
  const [history, setHistory] = useState<AnalysisData[]>([]);
  const [dashboardData, setDashboardData] = useState<Theme[]>([]);
  const [metadata, setMetadata] = useState<AnalysisData['metadata'] | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load history:', e);
        setHistory([SAMPLE_DATA]);
      }
    } else {
      setHistory([SAMPLE_DATA]);
    }
  }, []);

  // Save to history when data changes
  useEffect(() => {
    if (data && view === 'dashboard') {
      const newHistory = [
        data, 
        ...history.filter(h => h.metadata.analysis_id !== data.metadata.analysis_id)
      ].slice(0, 10);
      
      setHistory(newHistory);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    }
  }, [data?.metadata.analysis_id]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = JSON.parse(e.target?.result as string);
        console.log('Uploaded JSON:', result); // Debug log
        if (result.themes) {
          setDashboardData(result.themes);
          setMetadata(result.metadata || null);
          setView('dashboard');
          console.log("✅ Data Loaded Successfully");
        } else {
          console.error("❌ Invalid JSON: Themes array missing");
        }
      } catch (err) {
        console.error("❌ Parsing Error:", err);
      }
    };
    reader.readAsText(file);
  };

  const loadFromHistory = (item: AnalysisData) => {
    setData(item);
    setDashboardData(item.themes);
    setMetadata(item.metadata || null);
    setView('dashboard');
  };

  const dashboardRef = useRef<HTMLDivElement>(null);

  const exportReport = async () => {
    if (!dashboardRef.current) return;
    const input = dashboardRef.current;
    const canvas = await html2canvas(input, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save('dashboard.pdf');
  };

  // --- HOME VIEW ---
  if (view === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50 p-8 flex items-center justify-center">
        <div className="w-full max-w-2xl space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black mx-auto shadow-2xl shadow-indigo-200 transform hover:scale-105 transition-transform">
              NR
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">
                NeuroReddit Archive
              </h1>
              <p className="text-slate-600 text-lg">
                Correlating Lived Experience with Community Validation
              </p>
            </div>
          </div>

          {/* Upload Card */}
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-400 transition-colors p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto">
              <Upload size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Upload Analysis</h3>
              <p className="text-sm text-slate-500 mb-4">
                Import your Reddit analysis JSON file to generate validation dashboard
              </p>
            </div>
            <label className="inline-flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-lg transition-all cursor-pointer shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transform hover:scale-105">
              <Upload size={20} />
              <span>Choose JSON File</span>
              <input 
                type="file" 
                className="hidden" 
                accept=".json" 
                onChange={handleFileUpload} 
              />
            </label>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <BookOpen size={14} />
                Recent Analyses
              </h3>
              <div className="space-y-3">
                {history.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => loadFromHistory(item)}
                    className="w-full p-5 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-lg transition-all group text-left"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                          Chapter {item.metadata.chapter_number}
                        </span>
                        <h4 className="font-bold text-lg text-slate-900 group-hover:text-indigo-700 mt-1">
                          {item.metadata.analysis_id}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          {item.metadata.analyzed_at} • {item.themes.length} themes • 
                          {' '}{item.themes.reduce((s, t) => s + t.total_posts, 0).toLocaleString()} posts
                        </p>
                      </div>
                      <ChevronLeft 
                        size={24} 
                        className="rotate-180 text-slate-300 group-hover:text-indigo-600 transition-colors" 
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Demo Button */}
          <div className="text-center">
            <button
              onClick={() => {
                setData(SAMPLE_DATA);
                setDashboardData(SAMPLE_DATA.themes);
                setMetadata(SAMPLE_DATA.metadata || null);
                setView('dashboard');
              }}
              className="text-sm text-slate-500 hover:text-indigo-600 underline transition-colors"
            >
              View Sample Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- DASHBOARD VIEW ---
  if (view === 'dashboard') {
    if (!dashboardData || dashboardData.length === 0) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-lg text-center max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">No Data Loaded</h2>
            <p className="text-slate-600 mb-6">No analysis data was found. Please upload a valid analysis JSON file or return to the archive.</p>
            <button
              onClick={() => setView('home')}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Go Back to Archive
            </button>
          </div>
        </div>
      );
    }
    // Only call hooks and render dashboard if dashboardData is present
    const totalPosts = dashboardData.reduce((sum, t) => sum + t.total_posts, 0);
    const totalComments = dashboardData.reduce((sum, t) => sum + (t.engagement?.comments || 0), 0);
    const totalEngagement = totalPosts + totalComments;
    const filteredThemes = React.useMemo(() => {
      return activeFilter
        ? dashboardData.filter((t) => t.functional_type === activeFilter)
        : dashboardData;
    }, [dashboardData, activeFilter]);

    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm print:hidden">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <button
              onClick={() => setView('home')}
              className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors font-semibold"
            >
              <ChevronLeft size={18} />
              <span>Archive</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                {metadata?.chapter_number}
              </div>
              <div className="hidden md:block">
                <h1 className="font-bold text-slate-900">{metadata?.analysis_id}</h1>
                <p className="text-xs text-slate-500">Chapter {metadata?.chapter_number}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportReport}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                onClick={() => window.print()}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                title="Print Dashboard"
              >
                <Printer size={20} />
              </button>
            </div>
          </div>
        </header>
        <main ref={dashboardRef} className="max-w-7xl mx-auto px-6 py-10">
          {/* Methodology Banner */}
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-xl p-6 mb-10 print:mb-6">
            <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2 text-lg">
              <Info size={18} />
              Research Methodology
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <p className="font-semibold mb-1">Communities Analyzed</p>
                <p className="text-blue-700">{metadata?.subreddits?.join(', ')}</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Time Period</p>
                <p className="text-blue-700">{metadata?.time_filter}</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Total Volume</p>
                <p className="text-blue-700">
                  {totalPosts.toLocaleString()} posts across {dashboardData.length} themes
                </p>
              </div>
              <div>
                <p className="font-semibold mb-1">Analysis Date</p>
                <p className="text-blue-700">{metadata?.analyzed_at}</p>
              </div>
            </div>
          </div>
          {/* Theme Distribution Chart */}
          <ThemeDistributionChart data={{ metadata: metadata as any, themes: dashboardData }} />
          {/* Key Metrics */}
          <section className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Unique Authors */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Independent Validations
                </p>
                <p className="text-3xl font-bold text-indigo-600 my-2">
                  {metadata?.unique_authors?.toLocaleString() || '-'}
                </p>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Users size={12} /> Unique Individuals
                </p>
              </div>
              {/* Total Volume */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Total Volume
                </p>
                <p className="text-3xl font-bold text-teal-600 my-2">
                  {totalPosts.toLocaleString()}
                </p>
                <p className="text-xs text-slate-400">Community Posts</p>
              </div>
              {/* Engagement */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Total Engagement
                </p>
                <p className="text-3xl font-bold text-purple-600 my-2">
                  {totalEngagement.toLocaleString()}
                </p>
                <p className="text-xs text-slate-400">Posts + Comments</p>
              </div>
            </div>
            <StatsTable data={{ metadata: metadata as any, themes: dashboardData }} />
          </section>
          {/* Filter UI */}
          <div className="mb-8 flex flex-wrap gap-3 items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter by Functional Type:</span>
            <button
              className={`px-3 py-1 rounded-full border text-xs font-semibold transition-colors ${!activeFilter ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50'}`}
              onClick={() => setActiveFilter(null)}
            >
              All
            </button>
            {Array.from(new Set(dashboardData.map((t: Theme) => t.functional_type).filter(Boolean))).map((ft) => {
              const filterValue = ft ?? '';
              return (
                <button
                  key={filterValue}
                  className={`px-3 py-1 rounded-full border text-xs font-semibold transition-colors ${activeFilter === filterValue ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50'}`}
                  onClick={() => setActiveFilter(filterValue)}
                >
                  {filterValue}
                </button>
              );
            })}
          </div>
          {/* Theme Cards */}
          <section className="space-y-8">
            {filteredThemes.map((theme: Theme, index: number) => (
              <ThemeCard 
                key={index} 
                theme={theme} 
                totalPosts={totalPosts} 
              />
            ))}
          </section>
          {/* Footer */}
          <footer className="mt-16 pt-8 border-t border-slate-200 text-center text-sm text-slate-500">
            <p className="mb-2">
              Generated by <span className="font-semibold text-indigo-600">NeuroReddit Research Dashboard</span>
            </p>
            <p className="text-xs text-slate-400">
              Data collected: {metadata?.analyzed_at} • 
              Analysis ID: {metadata?.analysis_id}
            </p>
          </footer>
        </main>
      </div>
    );
  }

  return null;
};

export default App;