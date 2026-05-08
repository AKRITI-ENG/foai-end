import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const CACHE_KEY = 'news_cache_v1';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

export const useNewsData = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryCounts, setCategoryCounts] = useState({});

  const fetchNews = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsedCache = JSON.parse(cached);
          if (Date.now() - parsedCache.timestamp < CACHE_DURATION) {
            setNews(parsedCache.data);
            calculateCategories(parsedCache.data);
            setLoading(false);
            return;
          }
        }
      }

      const apiKey = import.meta.env.VITE_NEWS_API_KEY;
      let fetchedArticles = [];

      if (apiKey && apiKey !== 'your_newsapi_key_here') {
        // Use Event Registry (NewsAPI.ai)
        const res = await axios.get(
          `https://eventregistry.org/api/v1/article/getArticles?resultType=articles&articlesCount=10&apiKey=${apiKey}`
        );
        fetchedArticles = res.data?.articles?.results || [];
      } else {
        // Fallback for demonstration if no API key is provided
        const res = await axios.get('https://saurav.tech/NewsAPI/top-headlines/category/general/in.json');
        fetchedArticles = res.data?.articles?.slice(0, 10) || [];
      }

      // Format articles for consistency
      const formatted = fetchedArticles.map((a, index) => ({
        id: a.uri || index,
        title: a.title,
        source: a.source?.title || a.source?.name || 'Unknown Source',
        author: a.authors?.[0]?.name || a.author || 'Unknown',
        date: a.date || a.publishedAt || new Date().toISOString(),
        image: a.image || a.urlToImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=500&q=80',
        description: a.body?.substring(0, 150) || a.description || 'No description available.',
        url: a.url || '#',
        category: a.dataType || 'General'
      }));

      setNews(formatted);
      calculateCategories(formatted);

      // Save to cache
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data: formatted,
          timestamp: Date.now(),
        })
      );
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Failed to load news.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const calculateCategories = (articles) => {
    const counts = articles.reduce((acc, curr) => {
      acc[curr.source] = (acc[curr.source] || 0) + 1;
      return acc;
    }, {});
    setCategoryCounts(counts);
  };

  return { news, loading, error, fetchNews, categoryCounts };
};
