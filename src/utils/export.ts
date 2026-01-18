import { Theme } from '../types';

export const exportThemeToCSV = (theme: Theme) => {
  const headers = ['Metric', 'Value'];
  const rows = [
    ['Theme Name', theme.name],
    ['Description', theme.description],
    ['Total Posts', theme.total_posts.toString()],
    ['---', '---'],
    ['Subreddit Breakdown', ''],
    ...Object.entries(theme.by_subreddit).map(([sub, count]) => [sub, count.toString()]),
    ['---', '---'],
    ['Sentiment Breakdown', ''],
    ...Object.entries(theme.sentiment_breakdown).map(([sent, count]) => [sent, count.toString()]),
    ['---', '---'],
    ['Top Quotes', ''],
    ...theme.quotes.map((q, i) => [`Quote ${i + 1}`, q])
  ];

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${theme.name.toLowerCase().replace(/\s+/g, '_')}_analysis.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
