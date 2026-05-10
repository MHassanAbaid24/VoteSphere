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

export interface SimulatedVoteAnalysis {
  simulatedVotes: Record<string, Record<string, number>>;
  score: number;
  summary: string;
}

export interface ValidateParams {
  pollTitle: string;
  pollDescription: string;
  questions: Array<{
    id: string;
    text: string;
    options: Array<{ id: string; text: string }>;
  }>;
  sources: TavilySource[];
  personas: PersonaFeedback[];
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

Return a JSON object with a "personas" key holding the array of objects:
{
  "personas": [
    { "name": "string", "role": "string", "quote": "string", "avatar": "string" },
    ...
  ]
}

Generate personas that represent different perspectives and demographics relevant to the poll topic.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`, {
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
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown');
      throw new Error(`Gemini API error during persona generation: ${response.status} - ${errorBody}`);
    }

    const data = await response.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      return [];
    }

    const textContent = data.candidates[0].content.parts[0].text;

    let parsedData: any;
    try {
      // Attempt direct parse
      parsedData = JSON.parse(textContent);
    } catch (_e) {
      // Fallback to regex extraction
      const jsonMatch = textContent.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (jsonMatch) {
        try {
          parsedData = JSON.parse(jsonMatch[0]);
        } catch (__e) {
          throw new Error('Gemini failed to output parseable JSON block for personas.');
        }
      } else {
        throw new Error('Gemini failed to output any JSON structure for personas.');
      }
    }

    // Normalize output: support both raw array and root object wrappers
    let personasList: PersonaFeedback[] = [];
    if (Array.isArray(parsedData)) {
      personasList = parsedData;
    } else if (parsedData && typeof parsedData === 'object' && Array.isArray(parsedData.personas)) {
      personasList = parsedData.personas;
    } else if (parsedData && typeof parsedData === 'object') {
      // Look for any array field if they named it something else
      const key = Object.keys(parsedData).find(k => Array.isArray(parsedData[k]));
      if (key) personasList = parsedData[key];
    }

    if (!personasList || personasList.length === 0) {
      throw new Error('No persona objects found in response JSON.');
    }

    // Ensure all required fields are present
    return personasList.filter((p) => p && p.name && p.role && p.quote).slice(0, 5);
  } catch (error) {
    console.error('Error generating Gemini personas:', error);
    throw error;
  }
};

/**
 * Generates comprehensive vote analysis using Gemini API
 * Creates simulated vote distributions and feasibility score
 */
export const generateGeminiValidation = async (
  params: ValidateParams
): Promise<SimulatedVoteAnalysis> => {
  if (!env.GEMINI_API_KEY) {
    console.warn('Gemini API key not configured. Skipping vote analysis.');
    return {
      simulatedVotes: {},
      score: 0,
      summary: '',
    };
  }

  try {
    // Build question context for prompt
    const questionsContext = params.questions
      .map((q) => `Q: [${q.id}] ${q.text}\nOptions: ${q.options.map((o) => `[${o.id}] ${o.text}`).join(', ')}`)
      .join('\n\n');

    const sourceTitles = params.sources.map((s) => s.title).join(', ');
    const personaDescriptions = params.personas
      .map((p) => `${p.name} (${p.role}): "${p.quote}"`)
      .join('\n');

    const prompt = `Based on the following poll details, market research sources, and target personas, perform a comprehensive market validation analysis.

Poll: ${params.pollTitle}
Description: ${params.pollDescription}

Questions & Options:
${questionsContext}

Market Research Sources: ${sourceTitles || 'None'}

Target Personas:
${personaDescriptions || 'No personas provided'}

Generate a simulated vote distribution across 100 voters from the target personas and market segments. For each question, calculate the percentage distribution across options (must sum to 100% per question).

Return a JSON object with:
{
  "simulatedVotes": {
    "questionId": {
      "optionId": number,
      ...
    },
    ...
  },
  "score": number (0-100 feasibility score),
  "summary": "string (2-3 sentence executive summary of strategic recommendations)"
}

Ensure the simulatedVotes object matches the structure above. CRITICAL: Use the exact bracketed strings provided (e.g., "cuid..." from Q: [cuid] and [cuid] Option) directly as the keys for questionId and optionId in your JSON. Do not use question text or option text as keys. Make the analysis realistic based on the market research and personas.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`, {
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
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown');
      throw new Error(`Gemini API error during validation: ${response.status} - ${errorBody}`);
    }

    const data = await response.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      return {
        simulatedVotes: {},
        score: 0,
        summary: '',
      };
    }

    const textContent = data.candidates[0].content.parts[0].text;

    let analysis: SimulatedVoteAnalysis;
    try {
      analysis = JSON.parse(textContent);
    } catch (_e) {
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          analysis = JSON.parse(jsonMatch[0]);
        } catch (__e) {
          throw new Error('Gemini failed to generate parseable JSON for simulated analysis.');
        }
      } else {
        throw new Error('Gemini failed to output valid JSON structure for simulated analysis.');
      }
    }

    // Validate required fields
    if (!analysis.simulatedVotes || !analysis.summary || typeof analysis.score !== 'number') {
      return {
        simulatedVotes: analysis.simulatedVotes || {},
        score: analysis.score || 0,
        summary: analysis.summary || '',
      };
    }

    return analysis;
  } catch (error) {
    console.error('Error generating Gemini validation:', error);
    throw error;
  }
};
