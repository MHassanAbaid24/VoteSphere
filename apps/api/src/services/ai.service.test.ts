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
