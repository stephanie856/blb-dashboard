export interface AnalysisData {
  metadata: {
    chapter_number: number;
    analyzed_at: string;
    analysis_id: string;
    time_filter: string;
    subreddits: string[];
  };
  themes: Theme[];
}

export interface Theme {
  name: string;
  description: string;
  total_posts: number;
  by_subreddit: Record<string, number>;
  sentiment_breakdown: Record<string, number>;
  top_posts: TopPost[];
  quotes: string[];
  wordcloud_path: string;
}

export interface TopPost {
  title: string;
  upvotes: number;
  subreddit: string;
  url: string;
}
