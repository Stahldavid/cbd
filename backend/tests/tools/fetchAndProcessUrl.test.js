import { jest } from '@jest/globals';

// --- Mock Dependencies ---
const mockFetch = jest.fn();
jest.mock('node-fetch', () => ({
  __esModule: true,
  default: mockFetch,
}));

const mockIsAllowed = jest.fn(() => true); // Default to allowed
const mockRobotsParser = jest.fn(() => ({ isAllowed: mockIsAllowed }));
jest.mock('robots-parser', () => ({
  __esModule: true,
  default: mockRobotsParser,
}));

const mockReadabilityParse = jest.fn();
jest.mock('@mozilla/readability', () => ({
  Readability: jest.fn().mockImplementation(() => ({
    parse: mockReadabilityParse,
  })),
}));

const mockTurndown = jest.fn();
jest.mock('turndown', () => {
  return jest.fn().mockImplementation(() => ({
    turndown: mockTurndown,
  }));
});

// JSDOM needs careful mocking if its full behavior isn't needed
const mockGetElementsByTagName = jest.fn(() => []);
jest.mock('jsdom', () => ({
  JSDOM: jest.fn().mockImplementation(() => ({
    window: {
      document: {
        getElementsByTagName: mockGetElementsByTagName, // Mock specific methods if Readability relies on them
        // Mock other document properties/methods as needed by Readability or the code
      },
    },
  })),
}));

// --- Import the Tool ---
import {
  fetchAndProcessUrl,
  fetchAndProcessUrlDeclaration,
} from '../../tools/fetchAndProcessUrl.js';

describe('fetchAndProcessUrl Tool', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockRobotsParser.mockClear();
    mockIsAllowed.mockReset().mockReturnValue(true); // Ensure it's reset to true
    mockReadabilityParse.mockReset();
    mockTurndown.mockReset();
    mockGetElementsByTagName.mockReset().mockReturnValue([]);
    // Clear any other mocks if necessary
  });

  const testUrl = 'http://example.com/article';
  const robotsTxtUrl = 'http://example.com/robots.txt';

  describe('fetchAndProcessUrl function', () => {
    it('should return error for an invalid URLString', async () => {
      const result = await fetchAndProcessUrl({ urlString: 'invalid-url' });
      expect(result.result.success).toBe(false);
      expect(result.result.error).toContain('URL inválida fornecida');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should successfully fetch, parse HTML to Markdown, and slice content', async () => {
      const htmlContent = '<html><body><h1>Title</h1><p>This is article content.</p></body></html>';
      const readableArticle = {
        title: 'Title',
        content: '<p>This is article content.</p>',
        textContent: 'This is article content.',
      };
      const markdownContent = '# Title\n\nThis is article content.';

      mockFetch
        .mockResolvedValueOnce({
          status: 200,
          text: async () => 'User-agent: *\nAllow: /',
          ok: true,
        }) // robots.txt
        .mockResolvedValueOnce({
          ok: true,
          text: async () => htmlContent,
          headers: new Map([['content-type', 'text/html']]),
        }); // Main URL

      mockReadabilityParse.mockReturnValue(readableArticle);
      mockTurndown.mockReturnValue(markdownContent);

      const args = { urlString: testUrl, maxLength: 10, startIndex: 3 };
      const response = await fetchAndProcessUrl(args);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch.mock.calls[0][0]).toBe(robotsTxtUrl);
      expect(mockFetch.mock.calls[1][0]).toBe(testUrl);
      expect(mockIsAllowed).toHaveBeenCalledWith(testUrl, expect.any(String));
      expect(mockReadabilityParse).toHaveBeenCalled();
      expect(mockTurndown).toHaveBeenCalledWith(readableArticle.content);

      expect(response.result.success).toBe(true);
      expect(response.result.content).toBe(markdownContent.substring(3, 3 + 10));
    });

    it('should return raw HTML content if raw is true', async () => {
      const htmlContent = '<html><body><p>Raw HTML</p></body></html>';
      mockFetch
        .mockResolvedValueOnce({ status: 200, text: async () => 'Allow: /', ok: true }) // robots.txt
        .mockResolvedValueOnce({
          ok: true,
          text: async () => htmlContent,
          headers: new Map([['content-type', 'text/html']]),
        });

      const args = { urlString: testUrl, raw: true, maxLength: 100 };
      const response = await fetchAndProcessUrl(args);

      expect(response.result.success).toBe(true);
      expect(response.result.content).toBe(htmlContent);
      expect(mockReadabilityParse).not.toHaveBeenCalled();
      expect(mockTurndown).not.toHaveBeenCalled();
    });

    it('should return error if robots.txt disallows access', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        text: async () => 'User-agent: *\nDisallow: /',
        ok: true,
      }); // robots.txt disallows all
      mockIsAllowed.mockReturnValue(false);

      const response = await fetchAndProcessUrl({ urlString: testUrl });

      expect(response.result.success).toBe(false);
      expect(response.result.error).toContain(`negado por ${robotsTxtUrl}`);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only robots.txt should be fetched
    });

    it('should return error if robots.txt fetch fails (non-404 status)', async () => {
      mockFetch.mockResolvedValueOnce({ status: 500, text: async () => 'Server Error', ok: false }); // robots.txt fetch error

      const response = await fetchAndProcessUrl({ urlString: testUrl });
      expect(response.result.success).toBe(false);
      expect(response.result.error).toContain(`Não foi possível verificar ${robotsTxtUrl}`);
      expect(response.result.error).toContain('Status: 500');
    });

    it('should proceed if robots.txt is 404', async () => {
      mockFetch
        .mockResolvedValueOnce({ status: 404, text: async () => 'Not Found', ok: false }) // robots.txt not found
        .mockResolvedValueOnce({
          ok: true,
          text: async () => 'Hello',
          headers: new Map([['content-type', 'text/plain']]),
        }); // Main URL (plain text)

      const response = await fetchAndProcessUrl({ urlString: testUrl, raw: true }); // raw to avoid markdown error
      expect(response.result.success).toBe(true);
      expect(response.result.content).toBe('Hello');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should return error if main URL fetch fails', async () => {
      mockFetch
        .mockResolvedValueOnce({ status: 200, text: async () => 'Allow: /', ok: true }) // robots.txt
        .mockResolvedValueOnce({ ok: false, status: 403, statusText: 'Forbidden' }); // Main URL fetch error

      const response = await fetchAndProcessUrl({ urlString: testUrl });
      expect(response.result.success).toBe(false);
      expect(response.result.error).toContain(`Erro ao buscar URL (${testUrl})`);
      expect(response.result.error).toContain('Status: 403');
    });

    it('should return error if content is not HTML and raw is false', async () => {
      mockFetch
        .mockResolvedValueOnce({ status: 200, text: async () => 'Allow: /', ok: true })
        .mockResolvedValueOnce({
          ok: true,
          text: async () => 'Plain text content',
          headers: new Map([['content-type', 'text/plain']]),
        });

      const response = await fetchAndProcessUrl({ urlString: testUrl, raw: false });
      expect(response.result.success).toBe(false);
      expect(response.result.error).toContain('não é HTML');
      expect(response.result.error).toContain('Content-Type: text/plain');
    });

    it('should return raw content if content is not HTML and raw is true', async () => {
      const plainText = 'This is plain text.';
      mockFetch
        .mockResolvedValueOnce({ status: 200, text: async () => 'Allow: /', ok: true })
        .mockResolvedValueOnce({
          ok: true,
          text: async () => plainText,
          headers: new Map([['content-type', 'text/plain']]),
        });

      const response = await fetchAndProcessUrl({ urlString: testUrl, raw: true });
      expect(response.result.success).toBe(true);
      expect(response.result.content).toBe(plainText);
    });

    it('should handle Readability parsing error', async () => {
      mockFetch
        .mockResolvedValueOnce({ status: 200, text: async () => 'Allow: /', ok: true })
        .mockResolvedValueOnce({
          ok: true,
          text: async () => '<html_ok />',
          headers: new Map([['content-type', 'text/html']]),
        });
      mockReadabilityParse.mockReturnValue(null); // Simulate Readability failure

      const response = await fetchAndProcessUrl({ urlString: testUrl });
      expect(response.result.success).toBe(false);
      expect(response.result.error).toContain('Readability falhou na extração');
    });

    it('should handle empty markdown from Turndown', async () => {
      const htmlContent = '<html><body><p>Some content</p></body></html>';
      const readableArticle = { title: 'Title', content: '<p>Some content</p>' };
      mockFetch
        .mockResolvedValueOnce({ status: 200, text: async () => 'Allow: /', ok: true })
        .mockResolvedValueOnce({
          ok: true,
          text: async () => htmlContent,
          headers: new Map([['content-type', 'text/html']]),
        });
      mockReadabilityParse.mockReturnValue(readableArticle);
      mockTurndown.mockReturnValue('   '); // Empty or whitespace markdown

      const response = await fetchAndProcessUrl({ urlString: testUrl });
      expect(response.result.success).toBe(true);
      expect(response.result.content).toBe('   '); // Returns the whitespace, slicing might make it empty
    });

    it('should handle startIndex greater than content length', async () => {
      const markdownContent = 'Short markdown'; // length 14
      mockFetch
        .mockResolvedValueOnce({ status: 200, text: async () => 'Allow: /', ok: true })
        .mockResolvedValueOnce({
          ok: true,
          text: async () => '<html />',
          headers: new Map([['content-type', 'text/html']]),
        });
      mockReadabilityParse.mockReturnValue({ content: '<p>Short</p>' });
      mockTurndown.mockReturnValue(markdownContent);

      const response = await fetchAndProcessUrl({
        urlString: testUrl,
        startIndex: 20,
        maxLength: 10,
      });
      expect(response.result.success).toBe(true);
      expect(response.result.content).toBe('');
    });

    it('should handle robots.txt fetch timeout', async () => {
      mockFetch.mockImplementation((url) => {
        if (url === robotsTxtUrl) {
          return new Promise((_resolve, reject) =>
            setTimeout(
              () => reject(Object.assign(new Error('Fetch aborted'), { name: 'AbortError' })),
              10
            )
          );
        }
        // Should not reach here if robots.txt times out
        return Promise.resolve({ ok: true, text: async () => '', headers: new Map() });
      });

      const response = await fetchAndProcessUrl({ urlString: testUrl });
      expect(response.result.success).toBe(false);
      expect(response.result.error).toContain(`Timeout ao verificar ${robotsTxtUrl}`);
    });

    it('should handle main content fetch timeout', async () => {
      mockFetch
        .mockResolvedValueOnce({ status: 200, text: async () => 'Allow: /', ok: true }) // robots.txt
        .mockImplementationOnce((url) => {
          // For main URL
          if (url === testUrl) {
            return new Promise((_resolve, reject) =>
              setTimeout(
                () => reject(Object.assign(new Error('Fetch aborted'), { name: 'AbortError' })),
                10
              )
            );
          }
          return Promise.resolve({ ok: false }); // Should not happen
        });

      const response = await fetchAndProcessUrl({ urlString: testUrl });
      expect(response.result.success).toBe(false);
      expect(response.result.error).toContain(`Timeout ao buscar conteúdo de ${testUrl}`);
    });
  });

  describe('fetchAndProcessUrlDeclaration', () => {
    it('should have correct name and description', () => {
      expect(fetchAndProcessUrlDeclaration.name).toBe('fetch_and_process_url');
      expect(fetchAndProcessUrlDeclaration.description).toBeDefined();
    });

    it('should have urlString as a required parameter', () => {
      const props = fetchAndProcessUrlDeclaration.parameters.properties;
      expect(props.urlString.type).toBe('STRING');
      expect(fetchAndProcessUrlDeclaration.parameters.required).toEqual(['urlString']);
    });

    it('should define optional parameters maxLength, startIndex, and raw', () => {
      const props = fetchAndProcessUrlDeclaration.parameters.properties;
      expect(props.maxLength.type).toBe('INTEGER');
      expect(props.startIndex.type).toBe('INTEGER');
      expect(props.raw.type).toBe('BOOLEAN');
    });
  });
});
