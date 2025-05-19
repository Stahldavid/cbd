import request from 'supertest';
import setupApp from '../../config/express.js'; // Adjusted path

// Mock services that apiRoutes will depend on
// We need to mock before these modules are imported by apiRoutes or chatController
jest.mock('../../services/geminiService.js', () => ({ // Adjusted path
  initializeGeminiClient: jest.fn().mockReturnValue(true), // Assume success
  generateContent: jest.fn(),
  generateContentStream: jest.fn(),
  isInitialized: jest.fn().mockReturnValue(true),
}));

jest.mock('../../services/memoryService.js', () => ({ // Adjusted path
  conversationMemory: {
    sessions: {},
    initSession: jest.fn((sessionId) => {
      const session = { history: [], lastUpdate: Date.now() };
      // @ts-ignore
      global.conversationMemory.sessions[sessionId] = session;
      return session;
    }),
    getSession: jest.fn((sessionId) => {
      // @ts-ignore
      if (!global.conversationMemory.sessions[sessionId]) {
        // @ts-ignore
        return global.conversationMemory.initSession(sessionId);
      }
      // @ts-ignore
      return global.conversationMemory.sessions[sessionId];
    }),
    addUserMessage: jest.fn((sessionId, message) => {
      // @ts-ignore
      const session = global.conversationMemory.getSession(sessionId);
      const turn = { role: 'user', parts: [{ text: message }] };
      session.history.push(turn);
      session.lastUpdate = Date.now();
      return turn;
    }),
    addModelTextResponse: jest.fn((sessionId, text) => {
      // @ts-ignore
      const session = global.conversationMemory.getSession(sessionId);
      const turn = { role: 'model', parts: [{ text: text }] };
      session.history.push(turn);
      session.lastUpdate = Date.now();
      return turn;
    }),
    addFunctionCall: jest.fn((sessionId, name, args) => {
      // @ts-ignore
      const session = global.conversationMemory.getSession(sessionId);
      const turn = { role: 'model', parts: [{ functionCall: { name, args } }] };
      session.history.push(turn);
      session.lastUpdate = Date.now();
      return turn;
    }),
    addFunctionResult: jest.fn((sessionId, name, response) => {
      // @ts-ignore
      const session = global.conversationMemory.getSession(sessionId);
      const turn = { role: 'user', parts: [{ functionResponse: { name, response } }] };
      session.history.push(turn);
      session.lastUpdate = Date.now();
      return turn;
    }),
    getHistory: jest.fn(async (sessionId) => {
      // @ts-ignore
      const session = global.conversationMemory.getSession(sessionId);
      if (
        sessionId === 'tool-call-session' &&
        mockGeminiService &&
        mockGeminiService.generateContent.mock.calls.length > 0
      ) {
        return [
          { role: 'user', parts: [{ text: 'Search PubMed for cancer research' }] },
          {
            role: 'model',
            parts: [
              { functionCall: { name: 'search_pubmed', args: { query: 'cancer research' } } },
            ],
          },
          {
            role: 'user',
            parts: [
              { functionResponse: { name: 'search_pubmed', response: await mockSearchPubmed() } },
            ],
          },
        ];
      }
      return [...session.history];
    }),
    cleanup: jest.fn().mockReturnValue(0),
  },
  setupCleanupInterval: jest.fn(),
}));

// Mock a specific tool for testing function calling
const mockSearchPubmed = jest.fn().mockResolvedValue({
  results: 'Mocked PubMed results for testing.',
  references: ['PMID123'],
});

// Mock tools if they are complex or make external calls
jest.mock('../../tools/index.js', () => ({ // Adjusted path
  availableFunctions: {
    search_pubmed: mockSearchPubmed, // Mocking the actual function
    // Mock any other specific tools your chat might try to call by default or in tests
    // exampleTool: jest.fn().mockResolvedValue({ result: 'tool output' }),
  },
  allDeclarations: [
    { name: 'search_pubmed', description: 'Searches PubMed' }
    // { name: 'exampleTool', description: 'An example tool'}
  ],
}));

const app = setupApp(); // Create an instance of our app for testing

// Variables to hold the mocked modules
let mockGeminiService;
let mockMemoryService;

// Use beforeAll to asynchronously import the mocked modules
beforeAll(async () => {
  mockGeminiService = await import('../../services/geminiService.js'); // Adjusted path
  // @ts-ignore // memoryService mock is an object, not a module with named exports
  mockMemoryService = (await import('../../services/memoryService.js')).conversationMemory; // Adjusted path
  // @ts-ignore
  global.conversationMemory = mockMemoryService; // Make mock accessible to itself if needed for session mgmt
});

beforeEach(() => {
  if (mockGeminiService) {
    mockGeminiService.generateContent.mockReset();
    mockGeminiService.generateContentStream.mockReset();
  }
  if (mockMemoryService) {
    mockMemoryService.initSession.mockClear();
    mockMemoryService.getSession.mockClear();
    mockMemoryService.addUserMessage.mockClear();
    mockMemoryService.addModelTextResponse.mockClear();
    mockMemoryService.addFunctionCall.mockClear();
    mockMemoryService.addFunctionResult.mockClear();
    mockMemoryService.getHistory.mockClear();
    mockMemoryService.sessions = {}; // Clear sessions data
  }
  mockSearchPubmed.mockClear();
});

describe('API Routes', () => {
  describe('GET /api/test', () => {
    test('should return a success message', async () => {
      const response = await request(app).get('/api/test');
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ message: 'Backend API is running!' });
    });
  });

  describe('POST /api/chat', () => {
    test('should return a successful response for a valid query', async () => {
      const userQuery = 'Tell me a joke';
      const mockAiTextResponse = 'Why did the chicken cross the road?';

      mockMemoryService.getHistory.mockReturnValue([]);
      mockGeminiService.generateContent.mockResolvedValueOnce({
        response: {
          candidates: [{ content: { role: 'model', parts: [{ text: mockAiTextResponse }] } }],
        },
      });

      const response = await request(app)
        .post('/api/chat')
        .send({ query: userQuery, sessionId: 'test-chat-session' });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('response', mockAiTextResponse);
      expect(mockMemoryService.addUserMessage).toHaveBeenCalledWith('test-chat-session', userQuery);
      expect(mockMemoryService.addModelTextResponse).toHaveBeenCalledWith(
        'test-chat-session',
        mockAiTextResponse
      );
      expect(mockGeminiService.generateContent).toHaveBeenCalledTimes(1);
    });

    test('should handle a successful tool call via /api/chat', async () => {
      const userQuery = 'Search PubMed for cancer research';
      const sessionId = 'tool-call-session';
      const toolCallName = 'search_pubmed';
      const toolCallArgs = { query: 'cancer research' };
      const toolResponseText = 'Found some articles on PubMed about cancer research.';

      mockMemoryService.getHistory.mockImplementation(async (sid) => {
        if (sid === sessionId) {
          // Simulate history after first user message
          if (mockGeminiService.generateContent.mock.calls.length === 0) return [];
          // Simulate history after first LLM response (function call) and user function response
          return [
            { role: 'user', parts: [{ text: userQuery }] },
            {
              role: 'model',
              parts: [{ functionCall: { name: toolCallName, args: toolCallArgs } }],
            },
            {
              role: 'user',
              parts: [
                { functionResponse: { name: toolCallName, response: await mockSearchPubmed() } },
              ],
            },
          ];
        }
        return [];
      });

      // 1. Mock LLM response with a function call
      mockGeminiService.generateContent.mockResolvedValueOnce({
        response: {
          candidates: [
            {
              content: {
                role: 'model',
                parts: [{ functionCall: { name: toolCallName, args: toolCallArgs } }],
              },
            },
          ],
        },
      });

      // 2. Mock LLM response after the tool result
      mockGeminiService.generateContent.mockResolvedValueOnce({
        response: {
          candidates: [{ content: { role: 'model', parts: [{ text: toolResponseText }] } }],
        },
      });

      const response = await request(app)
        .post('/api/chat')
        .send({ query: userQuery, sessionId: sessionId });

      expect(response.statusCode).toBe(200);
      expect(response.body.response).toBe(toolResponseText);
      expect(mockGeminiService.generateContent).toHaveBeenCalledTimes(2);
      expect(mockSearchPubmed).toHaveBeenCalledWith(toolCallArgs);
      expect(mockMemoryService.addFunctionCall).toHaveBeenCalledWith(
        sessionId,
        toolCallName,
        toolCallArgs
      );
      expect(mockMemoryService.addFunctionResult).toHaveBeenCalledWith(
        sessionId,
        toolCallName,
        await mockSearchPubmed()
      );
      expect(mockMemoryService.addModelTextResponse).toHaveBeenCalledWith(
        sessionId,
        toolResponseText
      );
    });

    test('should handle Gemini service error', async () => {
      mockMemoryService.getHistory.mockReturnValue([]);
      mockGeminiService.generateContent.mockRejectedValue(new Error('Gemini API Error'));
      const response = await request(app)
        .post('/api/chat')
        .send({ query: 'error query', sessionId: 'test-error-session' });
      expect(response.statusCode).toBe(500);
      expect(response.body.error).toContain('Error processing chat: Gemini API Error');
    });

    test('should return 400 if query is missing', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ sessionId: 'test-no-query-session' });
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe('Query parameter is required');
    });
  });

  describe('POST /api/clear-session', () => {
    test('should clear session and return success', async () => {
      const sessionId = 'session-to-clear';
      const response = await request(app).post('/api/clear-session').send({ sessionId });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ message: 'Session history cleared' });
      expect(mockMemoryService.sessions[sessionId]).toBeUndefined(); // Check direct effect
    });

    test('should return 400 if sessionId is missing', async () => {
      const response = await request(app).post('/api/clear-session').send({});
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe('Session ID is required');
    });
  });

  // TODO: Add tests for /api/stream (more complex due to streaming nature)
}); 