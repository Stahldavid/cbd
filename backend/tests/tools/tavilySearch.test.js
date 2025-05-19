import { jest } from '@jest/globals';

// Mock the global fetch function
global.fetch = jest.fn();

// Import the functions to be tested
import { tavilySearch, tavilySearchDeclaration } from '../../tools/tavilySearch.js';

// Store original process.env
const originalEnv = process.env;

describe('tavilySearch Tool', () => {
  beforeEach(() => {
    // Reset fetch mock and environment variables before each test
    fetch.mockClear();
    process.env = { ...originalEnv }; // Restore original env
  });

  afterAll(() => {
    process.env = originalEnv; // Ensure original env is restored after all tests
  });

  describe('tavilySearch function', () => {
    it('should return an error if TAVILY_API_KEY is not set', async () => {
      delete process.env.TAVILY_API_KEY;
      const result = await tavilySearch({ query: 'test' });
      expect(result).toEqual({
        result: { success: false, error: 'TAVILY_API_KEY not configured on server.' },
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should make a successful API call with default parameters', async () => {
      process.env.TAVILY_API_KEY = 'test-api-key';
      const mockApiResponse = {
        results: [
          { title: 'Test Title 1', url: 'http://example.com/1', content: 'Snippet 1', score: 0.9 },
          { title: 'Test Title 2', url: 'http://example.com/2', content: 'Snippet 2', score: 0.8 },
        ],
      };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const args = { query: 'latest AI news' };
      const response = await tavilySearch(args);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'x-tavily-api-key': 'test-api-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: 'test-api-key',
          query: 'latest AI news',
          topic: 'general',
          search_depth: 'basic',
          max_results: 5, // Default
          include_answer: false,
          include_raw_content: false,
          include_images: false,
        }),
      });
      expect(response).toEqual({
        result: {
          success: true,
          results: [
            {
              title: 'Test Title 1',
              url: 'http://example.com/1',
              snippet: 'Snippet 1',
              score: 0.9,
            },
            {
              title: 'Test Title 2',
              url: 'http://example.com/2',
              snippet: 'Snippet 2',
              score: 0.8,
            },
          ],
        },
      });
    });

    it('should include optional parameters like max_results, include_domains, exclude_domains, and time_range if provided and valid', async () => {
      process.env.TAVILY_API_KEY = 'test-api-key';
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }), // Empty results are fine for this param test
      });

      const args = {
        query: 'coffee benefits',
        max_results: 3,
        include_domains: ['healthline.com', 'pubmed.gov'],
        exclude_domains: ['buzzfeed.com'],
        time_range: '1m',
      };
      await tavilySearch(args);

      expect(fetch).toHaveBeenCalledWith('https://api.tavily.com/search', {
        method: 'POST',
        headers: expect.any(Object),
        body: JSON.stringify({
          api_key: 'test-api-key',
          query: 'coffee benefits',
          topic: 'general',
          search_depth: 'basic',
          max_results: 3,
          include_answer: false,
          include_raw_content: false,
          include_images: false,
          include_domains: ['healthline.com', 'pubmed.gov'],
          exclude_domains: ['buzzfeed.com'],
          time_range: '1m',
        }),
      });
    });

    it('should ignore invalid time_range format', async () => {
      process.env.TAVILY_API_KEY = 'test-api-key';
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      });

      const args = {
        query: 'test query',
        time_range: 'invalid-range', // Invalid format
      };
      await tavilySearch(args);

      const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
      expect(requestBody.time_range).toBeUndefined();
    });

    it('should sanitize max_results to be within 1-10 range', async () => {
      process.env.TAVILY_API_KEY = 'test-api-key';
      fetch.mockResolvedValue({ ok: true, json: async () => ({ results: [] }) });

      // Test case 1: max_results too low
      await tavilySearch({ query: 'low results', max_results: 0 });
      let body = JSON.parse(fetch.mock.calls[0][1].body);
      expect(body.max_results).toBe(1);
      fetch.mockClear();

      // Test case 2: max_results too high
      await tavilySearch({ query: 'high results', max_results: 20 });
      body = JSON.parse(fetch.mock.calls[0][1].body);
      expect(body.max_results).toBe(10);
      fetch.mockClear();

      // Test case 3: max_results is not a number
      await tavilySearch({ query: 'nan results', max_results: 'abc' });
      body = JSON.parse(fetch.mock.calls[0][1].body);
      expect(body.max_results).toBe(5); // Defaults to 5 if parsing fails
      fetch.mockClear();

      // Test case 4: max_results within range
      await tavilySearch({ query: 'good results', max_results: 7 });
      body = JSON.parse(fetch.mock.calls[0][1].body);
      expect(body.max_results).toBe(7);
    });

    it('should handle API errors from fetch', async () => {
      process.env.TAVILY_API_KEY = 'test-api-key';
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid API Key',
      });

      const args = { query: 'test query' };
      const response = await tavilySearch(args);

      expect(response).toEqual({
        result: { success: false, error: 'Tavily API Error: 401 Unauthorized' },
      });
    });

    it('should handle network errors or other exceptions during fetch', async () => {
      process.env.TAVILY_API_KEY = 'test-api-key';
      fetch.mockRejectedValueOnce(new Error('Network connection failed'));

      const args = { query: 'test query' };
      const response = await tavilySearch(args);

      expect(response).toEqual({
        result: {
          success: false,
          error: 'Error during Tavily search execution: Network connection failed',
        },
      });
    });

    it('should return empty results array if API returns no results', async () => {
      process.env.TAVILY_API_KEY = 'test-api-key';
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }), // API returns empty array
      });

      const args = { query: 'obscure query' };
      const response = await tavilySearch(args);
      expect(response).toEqual({ result: { success: true, results: [] } });
    });

    it('should handle API response with null results', async () => {
      process.env.TAVILY_API_KEY = 'test-api-key';
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: null }), // API returns null for results
      });

      const args = { query: 'another obscure query' };
      const response = await tavilySearch(args);
      expect(response).toEqual({ result: { success: true, results: [] } });
    });
  });

  describe('tavilySearchDeclaration', () => {
    it('should have the correct name', () => {
      expect(tavilySearchDeclaration.name).toBe('tavily_search');
    });

    it('should have a description', () => {
      expect(tavilySearchDeclaration.description).toBeDefined();
      expect(tavilySearchDeclaration.description.length).toBeGreaterThan(0);
    });

    it('should define parameters as an object', () => {
      expect(tavilySearchDeclaration.parameters.type).toBe('OBJECT'); // Assuming Type.OBJECT resolves to 'OBJECT'
      expect(tavilySearchDeclaration.parameters.properties).toBeDefined();
    });

    it('should have a query parameter of type STRING and it should be required', () => {
      const queryParam = tavilySearchDeclaration.parameters.properties.query;
      expect(queryParam).toBeDefined();
      expect(queryParam.type).toBe('STRING'); // Assuming Type.STRING resolves to 'STRING'
      expect(queryParam.description).toBeDefined();
      expect(tavilySearchDeclaration.parameters.required).toContain('query');
    });

    it('should define optional parameters correctly', () => {
      const params = tavilySearchDeclaration.parameters.properties;
      expect(params.max_results.type).toBe('INTEGER');
      expect(params.include_domains.type).toBe('ARRAY');
      expect(params.exclude_domains.type).toBe('ARRAY');
      expect(params.time_range.type).toBe('STRING');
      expect(tavilySearchDeclaration.parameters.required.length).toBe(1); // Only query is required
    });
  });
});
