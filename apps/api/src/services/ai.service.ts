import { env } from '../config/env';

export interface TavilySource {
  title: string;
  url: string;
}

export interface PersonaFeedback {
  name: string;
  role: string;
  quote: string;
  avatar?: string;
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

/**
 * Generates synthetic personas using Gemini API
 * Creates 3-5 personas with names, roles, and quotes
 */
export const generateGeminiPersonas = async (
  pollContext: string,
  sources: TavilySource[]
): Promise<PersonaFeedback[]> => {
  if (!env.GEMINI_API_KEY) {
    console.warn('Gemini API key not configured. Skipping persona generation.');
    return [];
  }

  try {
    const sourceSummary = sources
      .map((s) => `- ${s.title}`)
      .join('\n');

    const prompt = `Based on the following poll context and research sources, generate 3-5 distinct synthetic personas that might be interested in or affected by this topic. 

Poll Context: ${pollContext}

Research Sources:
${sourceSummary || 'No sources provided'}

For each persona, provide:
1. Name (first name only)
2. Role/Title (their professional role or relevant identity)
3. Quote (a 1-2 sentence quote expressing their opinion/concern)
4. Avatar URL (use a placeholder URL like https://api.dicebear.com/7.x/avataaars/svg?seed=NAME)

Return as a JSON array with objects containing: { name, role, quote, avatar }

Generate personas that represent different perspectives and demographics relevant to the poll topic.`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      console.error(`Gemini API error: ${response.status}`);
      return [];
    }

    const data = await response.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      return [];
    }

    const textContent = data.candidates[0].content.parts[0].text;

    // Parse JSON from response
    const jsonMatch = textContent.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    const personas = JSON.parse(jsonMatch[0]) as PersonaFeedback[];

    // Ensure all required fields are present
    return personas.filter((p) => p.name && p.role && p.quote).slice(0, 5);
  } catch (error) {
    console.error('Error generating Gemini personas:', error);
    return [];
  }
};
