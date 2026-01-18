import React from 'react';
import { Theme } from '../types';
import { TrendingUp, MessageSquare, Heart, Lightbulb, Users } from 'lucide-react';

interface ThemeCardProps {
  theme: Theme;
  totalPostsInChapter: number;
}

const ThemeCard: React.FC<ThemeCardProps> = ({ theme, totalPostsInChapter }) => {
  const percentage = ((theme.total_posts / totalPostsInChapter) * 100).toFixed(1);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden print-break-inside-avoid">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 border-b border-slate-100">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-2xl font-bold text-slate-900">{theme.name}</h3>
          <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-indigo-100">
            <TrendingUp size={14} className="text-indigo-600" />
            <span className="text-sm font-bold text-indigo-600">{percentage}%</span>
          </div>
        </div>
        <p className="text-slate-600 leading-relaxed">{theme.description}</p>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase mb-1">
              <MessageSquare size={12} />
              Total Posts
            </div>
            <p className="text-2xl font-bold text-slate-900">{theme.total_posts.toLocaleString()}</p>
          </div>

          {Object.entries(theme.sentiment_breakdown).slice(0, 2).map(([sentiment, count]) => (
            <div key={sentiment} className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase mb-1">
                <Heart size={12} />
                {sentiment.replace(/_/g, ' ')}
              </div>
              <p className="text-2xl font-bold text-slate-900">{count}</p>
            </div>
          ))}
        </div>

        {theme.top_posts.length > 0 && (
          <div>
            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
              <Lightbulb size={14} />
              Top Posts
            </h4>
            <div className="space-y-2">
              {theme.top_posts.map((post, idx) => (
                
                  key={idx}
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <p className="font-semibold text-slate-900 mb-1">{post.title}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <TrendingUp size={12} />
                      {post.upvotes.toLocaleString()} upvotes
                    </span>
                    <span>r/{post.subreddit}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {theme.quotes.length > 0 && (
          <div>
            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
              <MessageSquare size={14} />
              Key Quotes
            </h4>
            <div className="space-y-2">
              {theme.quotes.map((quote, idx) => (
                <div key={idx} className="p-4 bg-indigo-50 border-l-4 border-indigo-600 rounded-r-lg">
                  <p className="text-slate-700 italic">"{quote}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
            <Users size={14} />
            By Subreddit
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.entries(theme.by_subreddit).map(([subreddit, count]) => (
              <div key={subreddit} className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">r/{subreddit}</p>
                <p className="text-lg font-bold text-slate-900">{count}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeCard;
