import { env } from '../config/env';

export interface TavilySource {
  title: string;
  url: string;
}

/**
 * Fetches search results from Tavily API
 * Returns top sources relevant to the query
 */
export const fetchTavilySearch = async (query: string): Promise<TavilySource[]> => {
  if (!env.TAVILY_API_KEY) {
    console.warn('Tavily API key not configured. Skipping web search.');
    return [];
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: env.TAVILY_API_KEY,
        query,
        max_results: 5,
        include_answer: false,
      }),
    });

    if (!response.ok) {
      console.error(`Tavily API error: ${response.status}`);
      return [];
    }

    const data = await response.json() as { results?: Array<{ title?: string; url?: string }> };

    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    // Extract top 3-5 sources
    return data.results
      .slice(0, 5)
      .filter((result) => result.title && result.url)
      .map((result) => ({
        title: result.title || '',
        url: result.url || '',
      }));
  } catch (error) {
    console.error('Error fetching Tavily search results:', error);
    return [];
  }
};
