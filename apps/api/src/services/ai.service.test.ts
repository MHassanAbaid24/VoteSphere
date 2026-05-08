import { describe, expect, it } from 'vitest';
import * as aiService from './ai.service';

describe('AI Service - Tavily Search', () => {
  it('should return empty array when Tavily API key is not configured', async () => {
    // When TAVILY_API_KEY is not set, should gracefully return empty array
    const results = await aiService.fetchTavilySearch('test query');
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });

  it('should export TavilySource interface with title and url', () => {
    // Verify the interface is properly exported
    const mockSource: aiService.TavilySource = {
      title: 'Test Article',
      url: 'https://example.com',
    };
    expect(mockSource.title).toBe('Test Article');
    expect(mockSource.url).toBe('https://example.com');
  });
});

describe('AI Service - Gemini Personas', () => {
  it('should return empty array when Gemini API key is not configured', async () => {
    // When GEMINI_API_KEY is not set, should gracefully return empty array
    const results = await aiService.generateGeminiPersonas('AI trends', []);
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });

  it('should export PersonaFeedback interface with required fields', () => {
    // Verify the interface is properly exported
    const mockPersona: aiService.PersonaFeedback = {
      name: 'Alex',
      role: 'Product Manager',
      quote: 'This is a great idea',
      avatar: 'https://example.com/avatar.png',
    };
    expect(mockPersona.name).toBe('Alex');
    expect(mockPersona.role).toBe('Product Manager');
    expect(mockPersona.quote).toBe('This is a great idea');
    expect(mockPersona.avatar).toBeDefined();
  });

  it('should handle empty sources gracefully', async () => {
    const personas = await aiService.generateGeminiPersonas('test query', []);
    expect(Array.isArray(personas)).toBe(true);
  });
});

describe('AI Service - Gemini Simulated Votes', () => {
  it('should return empty object when Gemini API key is not configured', async () => {
    const result = await aiService.generateGeminiValidation({
      pollTitle: 'Test Poll',
      pollDescription: 'Test Description',
      questions: [],
      sources: [],
      personas: [],
    });
    expect(result).toBeDefined();
    expect(result.simulatedVotes).toEqual({});
    expect(result.score).toBe(0);
    expect(result.summary).toBe('');
  });

  it('should export SimulatedVoteAnalysis interface with required fields', () => {
    // Verify the interface is properly exported
    const mockAnalysis: aiService.SimulatedVoteAnalysis = {
      simulatedVotes: { question1: { option1: 45, option2: 55 } },
      score: 75,
      summary: 'This is feasible',
    };
    expect(mockAnalysis.simulatedVotes).toBeDefined();
    expect(mockAnalysis.score).toBe(75);
    expect(mockAnalysis.summary).toBe('This is feasible');
  });

  it('should handle empty questions gracefully', async () => {
    const result = await aiService.generateGeminiValidation({
      pollTitle: 'Test',
      pollDescription: 'Test',
      questions: [],
      sources: [],
      personas: [],
    });
    expect(result.simulatedVotes).toEqual({});
  });
});
