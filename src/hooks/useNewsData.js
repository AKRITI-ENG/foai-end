import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const CACHE_KEY = 'news_cache_v3_newsapi';
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
        // Use NewsAPI.org
        const res = await axios.get(
          `https://newsapi.org/v2/everything?q=space OR NASA OR astronomy OR "International Space Station"&language=en&sortBy=publishedAt&pageSize=15&apiKey=${apiKey}`
        );
        fetchedArticles = res.data?.articles || [];
      } else {
        // Fallback for demonstration if no API key is provided - using science/tech category
        const res = await axios.get('https://saurav.tech/NewsAPI/top-headlines/category/science/us.json');
        fetchedArticles = res.data?.articles?.slice(0, 15) || [];
      }

      // Format articles for consistency
      const formatted = fetchedArticles
        .filter(a => a.title && a.title !== '[Removed]') // filter out removed articles common in NewsAPI
        .map((a, index) => ({
          id: a.url || index,
          title: a.title,
          source: a.source?.name || a.source?.title || 'Unknown Source',
          author: a.author || a.authors?.[0]?.name || 'Unknown',
          date: a.publishedAt || a.date || new Date().toISOString(),
          image: a.urlToImage || a.image || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
          description: a.description || a.body?.substring(0, 150) || 'No description available.',
          url: a.url || '#',
          category: 'Space & Tech' // NewsAPI 'everything' endpoint doesn't strictly categorize, so we assign one
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
      setError('Failed to load news. Check API Key or Rate Limits.');
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
