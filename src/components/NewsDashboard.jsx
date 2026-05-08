import React, { useState, useMemo } from 'react';
import { RefreshCw, Search, ExternalLink, Calendar, User, LayoutGrid, Filter, ChevronRight } from 'lucide-react';
import { useNewsData } from '../hooks/useNewsData';
import { format } from 'date-fns';

export default function NewsDashboard({ selectedCategory, onCategorySelect }) {
  const { news, loading, error, fetchNews } = useNewsData();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');

  // Extract unique categories (sources) for the dropdown
  const categories = useMemo(() => {
    const unique = new Set(news.map(n => n.source));
    return Array.from(unique).sort();
  }, [news]);

  const filteredAndSortedNews = useMemo(() => {
    let result = [...news];

    // Source / Category filter (from clicking pie chart OR dropdown)
    if (selectedCategory) {
      result = result.filter(article => article.source === selectedCategory);
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (article) =>
          article.title?.toLowerCase().includes(q) ||
          article.description?.toLowerCase().includes(q) ||
          article.source?.toLowerCase().includes(q)
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'latest') {
        return new Date(b.date) - new Date(a.date);
      } else if (sortBy === 'oldest') {
        return new Date(a.date) - new Date(b.date);
      } else if (sortBy === 'source') {
        return a.source.localeCompare(b.source);
      }
      return 0;
    });

    return result.slice(0, 5); // Show top 5 as requested
  }, [news, searchQuery, sortBy, selectedCategory]);

  return (
    <div className="flex flex-col h-full rounded-2xl border border-[hsl(var(--border))]/50 bg-[hsl(var(--card))]/50 backdrop-blur-xl shadow-xl shadow-black/5 hover:border-[hsl(var(--border))] transition-colors overflow-hidden relative">
      
      {/* Header & Controls */}
      <div className="p-5 border-b border-[hsl(var(--border))]/50 space-y-4 bg-gradient-to-b from-[hsl(var(--muted))]/30 to-transparent">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-500">
              <LayoutGrid className="w-5 h-5" />
            </div>
            Latest News
          </h2>
          <button
            onClick={() => fetchNews(true)}
            disabled={loading}
            className="p-2.5 rounded-xl border border-[hsl(var(--border))]/50 bg-[hsl(var(--background))]/50 hover:bg-[hsl(var(--accent))] transition-all active:scale-95 disabled:opacity-50"
            title="Refresh news"
            aria-label="Refresh news"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            <input
              type="text"
              placeholder="Search news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[hsl(var(--border))]/50 bg-[hsl(var(--background))]/50 pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all placeholder:text-[hsl(var(--muted-foreground))]"
            />
          </div>
          
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute left-2.5 top-3 h-4 w-4 text-[hsl(var(--muted-foreground))] pointer-events-none" />
              <select
                value={selectedCategory || ''}
                onChange={(e) => onCategorySelect(e.target.value || null)}
                className="w-full sm:w-auto appearance-none rounded-xl border border-[hsl(var(--border))]/50 bg-[hsl(var(--background))]/50 pl-9 pr-8 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer"
                title="Filter by Source"
              >
                <option value="">All Sources</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <div className="absolute right-2.5 top-3.5 pointer-events-none">
                <div className="w-2 h-2 border-r-2 border-b-2 border-[hsl(var(--muted-foreground))] rotate-45 transform"></div>
              </div>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none rounded-xl border border-[hsl(var(--border))]/50 bg-[hsl(var(--background))]/50 px-4 pr-8 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer"
              title="Sort By"
            >
              <option value="latest">Latest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>
      </div>

      {/* News List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 scroll-smooth">
        {loading && news.length === 0 ? (
          // Skeleton Loading
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-4 animate-pulse p-4 rounded-xl border border-[hsl(var(--border))]/30">
              <div className="w-full sm:w-28 h-32 sm:h-28 bg-[hsl(var(--muted))] rounded-lg shrink-0"></div>
              <div className="flex-1 space-y-3 py-1">
                <div className="h-4 bg-[hsl(var(--muted))] rounded w-3/4"></div>
                <div className="h-3 bg-[hsl(var(--muted))] rounded w-1/2"></div>
                <div className="h-3 bg-[hsl(var(--muted))] rounded w-full mt-4"></div>
              </div>
            </div>
          ))
        ) : error && news.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-red-500">
              <ExternalLink className="w-8 h-8" />
            </div>
            <p className="text-[hsl(var(--destructive))] font-medium mb-2">{error}</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">Could not fetch the latest news from the server.</p>
            <button 
              onClick={() => fetchNews(true)} 
              className="px-4 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-lg hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
          </div>
        ) : filteredAndSortedNews.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 text-[hsl(var(--muted-foreground))]">
            <div className="w-16 h-16 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center mb-4">
              <Search className="w-8 h-8 opacity-50" />
            </div>
            <p className="font-medium">No articles found.</p>
            <p className="text-sm mt-1">Try adjusting your search or filters.</p>
            {(searchQuery || selectedCategory) && (
              <button 
                onClick={() => { setSearchQuery(''); onCategorySelect(null); }}
                className="mt-4 text-sm text-purple-500 hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedNews.map((article) => (
              <article 
                key={article.id} 
                className="group flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-[hsl(var(--border))]/40 bg-[hsl(var(--card))]/50 backdrop-blur-md hover:bg-[hsl(var(--card))]/80 hover:border-purple-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1"
              >
                <div className="w-full sm:w-32 h-40 sm:h-32 shrink-0 overflow-hidden rounded-lg bg-[hsl(var(--muted))] relative">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=500&q=80'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 sm:hidden">
                     <span className="text-white text-xs font-medium">{article.source}</span>
                  </div>
                </div>
                
                <div className="flex flex-col justify-between flex-1 min-w-0">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                        {article.source}
                      </span>
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))] flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> 
                        {format(new Date(article.date), 'MMM d, p')}
                      </span>
                    </div>
                    
                    <h3 className="font-bold text-sm sm:text-base line-clamp-2 leading-snug mb-1.5 group-hover:text-purple-500 transition-colors">
                      {article.title}
                    </h3>
                    
                    <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] line-clamp-2 mb-3">
                      {article.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1.5 max-w-[120px] truncate">
                      <div className="w-5 h-5 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center shrink-0">
                        <User className="w-3 h-3" />
                      </div>
                      <span className="truncate">{article.author}</span>
                    </span>
                    
                    <a 
                      href={article.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-primary/90 transition-all active:scale-95 shadow-sm group-hover:shadow-md hover:gap-2"
                    >
                      Read More <ChevronRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </article>
            ))}
            
            <div className="pt-2 text-center text-xs text-[hsl(var(--muted-foreground))]">
              Showing top {filteredAndSortedNews.length} articles
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
