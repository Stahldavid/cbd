import { jest } from '@jest/globals';

// Mock services
jest.mock('../../services/memoryService.js', () => ({
  conversationMemory: {
    addUserMessage: jest.fn(),
    addModelTextResponse: jest.fn(),
    addFunctionCall: jest.fn(),
    addFunctionResult: jest.fn(),
    getHistory: jest.fn(() => []),
    clearSession: jest.fn(),
    getHistoryString: jest.fn(() => ''), // Add if used by controller directly
    // ... any other methods used by chatController
  },
}));
jest.mock('../../services/geminiService.js', () => ({
  generateContent: jest.fn(),
  generateContentStream: jest.fn(),
  isInitialized: jest.fn(() => true),
}));

// Mock tools (actual tools, not just declarations)
const mockAvailableFunctions = {
  search_weather: jest.fn(async (args) => ({
    result: { weather: 'sunny', temperature: `${args.location === 'London' ? 25 : 30}C` },
  })),
  // Add other mock functions if the controller logic depends on specific function names being present
};
jest.mock('../../tools/index.js', () => ({
  availableFunctions: mockAvailableFunctions,
  allDeclarations: [
    // Provide mock declarations if controller uses them
    { name: 'search_weather', description: 'Gets weather', parameters: {} },
  ],
}));

// Import the controller AFTER mocks are set up
import {
  handleChat,
  handleStreamChat,
  clearSession,
  getSessionHistory,
} from '../../controllers/chatController.js';

// Helper for mock request and response
const mockRequest = (body = {}, params = {}, query = {}) => ({
  body,
  params,
  query,
  // Mock session if used
  // session: {},
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.write = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
};

const SYSTEM_INSTRUCTION = 'Test Instruction';
const TOOLS_CONFIG = [
  {
    /* mock tool config if needed by generateContent */
  },
];

describe('chatController', () => {
  let req;
  let res;

  beforeEach(async () => {
    jest.clearAllMocks(); // Clear mocks before each test
    res = mockResponse();
    // Reset mocks for services that might have state or specific return values per test
    const { conversationMemory } = await import('../../services/memoryService.js');
    const { isInitialized } = await import('../../services/geminiService.js');

    isInitialized.mockReturnValue(true);
    conversationMemory.getHistory.mockReturnValue([{ role: 'user', parts: [{ text: 'Hello' }] }]);
    conversationMemory.addUserMessage.mockImplementation(() => {});
    conversationMemory.addModelTextResponse.mockImplementation(() => {});
    conversationMemory.addFunctionCall.mockImplementation(() => {});
    conversationMemory.addFunctionResult.mockImplementation(() => {});
  });

  describe('handleChat', () => {
    it('should return 400 if message is not provided', async () => {
      req = mockRequest({});
      await handleChat(req, res, mockAvailableFunctions, SYSTEM_INSTRUCTION, TOOLS_CONFIG);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Message required' });
    });

    it('should return 503 if AI service is not initialized', async () => {
      const { isInitialized: mockIsInitialized } = await import('../../services/geminiService.js');
      mockIsInitialized.mockReturnValue(false);
      req = mockRequest({ message: 'Test message' });
      await handleChat(req, res, mockAvailableFunctions, SYSTEM_INSTRUCTION, TOOLS_CONFIG);
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({ error: 'AI service not available.' });
    });

    it('should process a simple chat message and return a text response', async () => {
      req = mockRequest({ message: 'Hello there', sessionId: 'test-session-123' });
      const { conversationMemory } = await import('../../services/memoryService.js');
      const { generateContent } = await import('../../services/geminiService.js');

      conversationMemory.getHistory.mockReturnValueOnce([
        { role: 'user', parts: [{ text: 'Hello there' }] },
      ]);
      generateContent.mockResolvedValueOnce({
        response: {
          candidates: [{ content: { parts: [{ text: 'Hi! How can I help?' }], role: 'model' } }],
        },
      });

      await handleChat(req, res, mockAvailableFunctions, SYSTEM_INSTRUCTION, TOOLS_CONFIG);

      expect(conversationMemory.addUserMessage).toHaveBeenCalledWith(
        'test-session-123',
        'Hello there'
      );
      expect(generateContent).toHaveBeenCalledWith(
        expect.any(String), // model name
        [{ role: 'user', parts: [{ text: 'Hello there' }] }],
        SYSTEM_INSTRUCTION,
        TOOLS_CONFIG
      );
      expect(conversationMemory.addModelTextResponse).toHaveBeenCalledWith(
        'test-session-123',
        'Hi! How can I help?'
      );
      expect(res.json).toHaveBeenCalledWith({ text: 'Hi! How can I help?' });
    });

    it('should handle a function call and then a text response', async () => {
      req = mockRequest({
        message: 'What is the weather in London?',
        sessionId: 'test-session-func',
      });
      const { conversationMemory } = await import('../../services/memoryService.js');
      const { generateContent } = await import('../../services/geminiService.js');

      const initialHistory = [
        { role: 'user', parts: [{ text: 'What is the weather in London?' }] },
      ];
      const historyAfterFuncCall = [
        ...initialHistory,
        {
          role: 'model',
          parts: [{ functionCall: { name: 'search_weather', args: { location: 'London' } } }],
        },
      ];
      const historyAfterFuncResult = [
        ...historyAfterFuncCall,
        {
          role: 'function',
          parts: [
            {
              functionResponse: {
                name: 'search_weather',
                response: { result: { weather: 'sunny', temperature: '25C' } },
              },
            },
          ],
        },
      ];

      conversationMemory.getHistory
        .mockReturnValueOnce(initialHistory) // First call for initial prompt
        .mockReturnValueOnce(historyAfterFuncResult); // Second call for prompt after function result

      // First call to Gemini: requests a function call
      generateContent.mockResolvedValueOnce({
        response: {
          candidates: [
            {
              content: {
                parts: [{ functionCall: { name: 'search_weather', args: { location: 'London' } } }],
                role: 'model',
              },
            },
          ],
        },
      });

      // Second call to Gemini: provides final text response
      generateContent.mockResolvedValueOnce({
        response: {
          candidates: [
            {
              content: {
                parts: [{ text: 'The weather in London is sunny and 25C.' }],
                role: 'model',
              },
            },
          ],
        },
      });

      mockAvailableFunctions.search_weather.mockResolvedValueOnce({
        result: { weather: 'sunny', temperature: '25C' },
      });

      await handleChat(req, res, mockAvailableFunctions, SYSTEM_INSTRUCTION, TOOLS_CONFIG);

      expect(conversationMemory.addUserMessage).toHaveBeenCalledWith(
        'test-session-func',
        'What is the weather in London?'
      );
      expect(conversationMemory.addFunctionCall).toHaveBeenCalledWith(
        'test-session-func',
        'search_weather',
        { location: 'London' }
      );
      expect(mockAvailableFunctions.search_weather).toHaveBeenCalledWith({ location: 'London' });
      expect(conversationMemory.addFunctionResult).toHaveBeenCalledWith(
        'test-session-func',
        'search_weather',
        { weather: 'sunny', temperature: '25C' }
      );

      expect(generateContent).toHaveBeenCalledTimes(2);
      expect(generateContent).toHaveBeenNthCalledWith(
        1,
        expect.any(String),
        initialHistory,
        SYSTEM_INSTRUCTION,
        TOOLS_CONFIG
      );
      expect(generateContent).toHaveBeenNthCalledWith(
        2,
        expect.any(String),
        historyAfterFuncResult,
        SYSTEM_INSTRUCTION,
        TOOLS_CONFIG
      );

      expect(conversationMemory.addModelTextResponse).toHaveBeenCalledWith(
        'test-session-func',
        'The weather in London is sunny and 25C.'
      );
      expect(res.json).toHaveBeenCalledWith({ text: 'The weather in London is sunny and 25C.' });
    });

    it('should handle errors during function execution', async () => {
      req = mockRequest({
        message: 'What is the weather in FaultyCity?',
        sessionId: 'test-session-func-error',
      });
      const { conversationMemory } = await import('../../services/memoryService.js');
      const { generateContent } = await import('../../services/geminiService.js');

      const initialHistory = [
        { role: 'user', parts: [{ text: 'What is the weather in FaultyCity?' }] },
      ];
      conversationMemory.getHistory.mockReturnValue(initialHistory); // Simplified for this test

      generateContent
        .mockResolvedValueOnce({
          // Gemini asks to call the function
          response: {
            candidates: [
              {
                content: {
                  parts: [
                    { functionCall: { name: 'search_weather', args: { location: 'FaultyCity' } } },
                  ],
                  role: 'model',
                },
              },
            ],
          },
        })
        .mockResolvedValueOnce({
          // Gemini responds after function error
          response: {
            candidates: [
              {
                content: {
                  parts: [
                    { text: 'I could not retrieve the weather for FaultyCity due to an error.' },
                  ],
                  role: 'model',
                },
              },
            ],
          },
        });

      mockAvailableFunctions.search_weather.mockRejectedValueOnce(new Error('API timeout'));

      await handleChat(req, res, mockAvailableFunctions, SYSTEM_INSTRUCTION, TOOLS_CONFIG);

      expect(conversationMemory.addFunctionCall).toHaveBeenCalledWith(
        'test-session-func-error',
        'search_weather',
        { location: 'FaultyCity' }
      );
      expect(mockAvailableFunctions.search_weather).toHaveBeenCalledWith({
        location: 'FaultyCity',
      });
      expect(conversationMemory.addFunctionResult).toHaveBeenCalledWith(
        'test-session-func-error',
        'search_weather',
        { success: false, error: "Erro ao executar a função 'search_weather': API timeout" }
      );
      expect(conversationMemory.addModelTextResponse).toHaveBeenCalledWith(
        'test-session-func-error',
        'I could not retrieve the weather for FaultyCity due to an error.'
      );
      expect(res.json).toHaveBeenCalledWith({
        text: 'I could not retrieve the weather for FaultyCity due to an error.',
      });
    });

    it('should handle unknown function call requested by model', async () => {
      req = mockRequest({
        message: 'Do something magical',
        sessionId: 'test-session-unknown-func',
      });
      const { conversationMemory } = await import('../../services/memoryService.js');
      const { generateContent } = await import('../../services/geminiService.js');

      const initialHistory = [{ role: 'user', parts: [{ text: 'Do something magical' }] }];
      conversationMemory.getHistory.mockReturnValue(initialHistory);

      generateContent
        .mockResolvedValueOnce({
          // Gemini asks to call an unknown function
          response: {
            candidates: [
              {
                content: {
                  parts: [{ functionCall: { name: 'do_magic', args: { spell: 'abracadabra' } } }],
                  role: 'model',
                },
              },
            ],
          },
        })
        .mockResolvedValueOnce({
          // Gemini responds after unknown function
          response: {
            candidates: [
              {
                content: {
                  parts: [
                    { text: 'I tried to use a magical function, but it was not recognized.' },
                  ],
                  role: 'model',
                },
              },
            ],
          },
        });

      await handleChat(req, res, mockAvailableFunctions, SYSTEM_INSTRUCTION, TOOLS_CONFIG);

      expect(conversationMemory.addFunctionCall).toHaveBeenCalledWith(
        'test-session-unknown-func',
        'do_magic',
        { spell: 'abracadabra' }
      );
      expect(conversationMemory.addFunctionResult).toHaveBeenCalledWith(
        'test-session-unknown-func',
        'do_magic',
        { success: false, error: "Função 'do_magic' não reconhecida." }
      );
      expect(conversationMemory.addModelTextResponse).toHaveBeenCalledWith(
        'test-session-unknown-func',
        'I tried to use a magical function, but it was not recognized.'
      );
      expect(res.json).toHaveBeenCalledWith({
        text: 'I tried to use a magical function, but it was not recognized.',
      });
    });

    it('should limit sequential function calls to MAX_FUNCTION_CALLS (5)', async () => {
      req = mockRequest({ message: 'Start a loop', sessionId: 'test-session-loop' });
      const { conversationMemory } = await import('../../services/memoryService.js');
      const { generateContent } = await import('../../services/geminiService.js');

      const MAX_CALLS = 5; // As defined in chatController.js
      conversationMemory.getHistory.mockReturnValue([
        { role: 'user', parts: [{ text: 'Start a loop' }] },
      ]); // Simplified history

      // Mock generateContent to always return a function call
      for (let i = 0; i < MAX_CALLS; i++) {
        generateContent.mockResolvedValueOnce({
          response: {
            candidates: [
              {
                content: {
                  parts: [
                    { functionCall: { name: 'search_weather', args: { location: `City${i}` } } },
                  ],
                  role: 'model',
                },
              },
            ],
          },
        });
        mockAvailableFunctions.search_weather.mockResolvedValueOnce({
          result: { weather: 'looping', temperature: `${i}C` },
        });
      }
      // Final call to generateContent should result in a text response after MAX_CALLS
      generateContent.mockResolvedValueOnce({
        response: {
          candidates: [
            { content: { parts: [{ text: 'Loop finished after max calls.' }], role: 'model' } },
          ],
        },
      });

      await handleChat(req, res, mockAvailableFunctions, SYSTEM_INSTRUCTION, TOOLS_CONFIG);

      expect(generateContent).toHaveBeenCalledTimes(MAX_CALLS + 1); // MAX_CALLS for function calls + 1 for final response
      expect(mockAvailableFunctions.search_weather).toHaveBeenCalledTimes(MAX_CALLS);
      for (let i = 0; i < MAX_CALLS; i++) {
        expect(conversationMemory.addFunctionCall).toHaveBeenCalledWith(
          'test-session-loop',
          'search_weather',
          { location: `City${i}` }
        );
        expect(conversationMemory.addFunctionResult).toHaveBeenCalledWith(
          'test-session-loop',
          'search_weather',
          { weather: 'looping', temperature: `${i}C` }
        );
      }
      expect(conversationMemory.addModelTextResponse).toHaveBeenCalledWith(
        'test-session-loop',
        'Loop finished after max calls.'
      );
      expect(res.json).toHaveBeenCalledWith({ text: 'Loop finished after max calls.' });
    });

    it('should handle error from generateContent', async () => {
      req = mockRequest({ message: 'Hello', sessionId: 'test-session-gen-error' });
      const { generateContent } = await import('../../services/geminiService.js');

      generateContent.mockRejectedValueOnce(new Error('Gemini API Error'));

      await handleChat(req, res, mockAvailableFunctions, SYSTEM_INSTRUCTION, TOOLS_CONFIG);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error processing request: Gemini API Error',
      });
    });

    it('should use default sessionId if not provided', async () => {
      req = mockRequest({ message: 'Hello there' }); // No sessionId
      const { conversationMemory } = await import('../../services/memoryService.js');
      const { generateContent } = await import('../../services/geminiService.js');

      conversationMemory.getHistory.mockReturnValueOnce([
        { role: 'user', parts: [{ text: 'Hello there' }] },
      ]);
      generateContent.mockResolvedValueOnce({
        response: {
          candidates: [{ content: { parts: [{ text: 'Hi!' }], role: 'model' } }],
        },
      });

      await handleChat(req, res, mockAvailableFunctions, SYSTEM_INSTRUCTION, TOOLS_CONFIG);

      expect(conversationMemory.addUserMessage).toHaveBeenCalledWith('default', 'Hello there');
      expect(conversationMemory.addModelTextResponse).toHaveBeenCalledWith('default', 'Hi!');
      expect(res.json).toHaveBeenCalledWith({ text: 'Hi!' });
    });

    it('should correctly extract model response text even if parts are mixed', async () => {
      req = mockRequest({ message: 'Tell me a story', sessionId: 'test-session-mixed' });
      const { conversationMemory } = await import('../../services/memoryService.js');
      const { generateContent } = await import('../../services/geminiService.js');

      conversationMemory.getHistory.mockReturnValueOnce([
        { role: 'user', parts: [{ text: 'Tell me a story' }] },
      ]);
      generateContent.mockResolvedValueOnce({
        response: {
          candidates: [
            {
              content: {
                parts: [
                  { text: 'Once upon a time, ' },
                  // Potentially a function call part here if the model was structured differently
                  // { functionCall: { name: 'get_character_name', args: {} } },
                  { text: 'there was a brave knight.' },
                ],
                role: 'model',
              },
            },
          ],
        },
      });

      await handleChat(req, res, mockAvailableFunctions, SYSTEM_INSTRUCTION, TOOLS_CONFIG);
      expect(conversationMemory.addModelTextResponse).toHaveBeenCalledWith(
        'test-session-mixed',
        'Once upon a time, there was a brave knight.'
      );
      expect(res.json).toHaveBeenCalledWith({
        text: 'Once upon a time, there was a brave knight.',
      });
    });

    it('should handle response with only function calls initially, then text', async () => {
      req = mockRequest({
        message: 'Weather and then news for London',
        sessionId: 'test-session-fc-only',
      });
      const { conversationMemory } = await import('../../services/memoryService.js');
      const { generateContent } = await import('../../services/geminiService.js');

      const initialHistory = [
        { role: 'user', parts: [{ text: 'Weather and then news for London' }] },
      ];
      const historyAfterFuncCall = [
        ...initialHistory,
        {
          role: 'model',
          parts: [{ functionCall: { name: 'search_weather', args: { location: 'London' } } }],
        },
      ];
      const historyAfterFuncResult = [
        ...historyAfterFuncCall,
        {
          role: 'function',
          parts: [
            {
              functionResponse: {
                name: 'search_weather',
                response: { result: { weather: 'cloudy', temperature: '18C' } },
              },
            },
          ],
        },
      ];

      conversationMemory.getHistory
        .mockReturnValueOnce(initialHistory)
        .mockReturnValueOnce(historyAfterFuncResult);

      // First call: Gemini responds *only* with a function call part (no immediate text)
      generateContent.mockResolvedValueOnce({
        response: {
          candidates: [
            {
              content: {
                parts: [{ functionCall: { name: 'search_weather', args: { location: 'London' } } }],
                role: 'model',
              },
            },
          ],
        },
      });

      // Mock the function execution
      mockAvailableFunctions.search_weather.mockResolvedValueOnce({
        result: { weather: 'cloudy', temperature: '18C' },
      });

      // Second call: Gemini responds with text
      generateContent.mockResolvedValueOnce({
        response: {
          candidates: [
            {
              content: {
                parts: [{ text: 'London is cloudy at 18C. No news available.' }],
                role: 'model',
              },
            },
          ],
        },
      });

      await handleChat(req, res, mockAvailableFunctions, SYSTEM_INSTRUCTION, TOOLS_CONFIG);

      expect(conversationMemory.addUserMessage).toHaveBeenCalledWith(
        'test-session-fc-only',
        'Weather and then news for London'
      );
      expect(conversationMemory.addFunctionCall).toHaveBeenCalledWith(
        'test-session-fc-only',
        'search_weather',
        { location: 'London' }
      );
      expect(mockAvailableFunctions.search_weather).toHaveBeenCalledWith({ location: 'London' });
      expect(conversationMemory.addFunctionResult).toHaveBeenCalledWith(
        'test-session-fc-only',
        'search_weather',
        { weather: 'cloudy', temperature: '18C' }
      );

      expect(generateContent).toHaveBeenCalledTimes(2);
      expect(conversationMemory.addModelTextResponse).toHaveBeenCalledWith(
        'test-session-fc-only',
        'London is cloudy at 18C. No news available.'
      );
      expect(res.json).toHaveBeenCalledWith({
        text: 'London is cloudy at 18C. No news available.',
      });
    });

    it('should use a default non-empty text if model response is completely empty or invalid after loop', async () => {
      req = mockRequest({ message: 'Trigger empty response', sessionId: 'test-empty-final' });
      const { conversationMemory } = await import('../../services/memoryService.js');
      const { generateContent } = await import('../../services/geminiService.js');

      conversationMemory.getHistory.mockReturnValueOnce([
        { role: 'user', parts: [{ text: 'Trigger empty response' }] },
      ]);
      generateContent.mockResolvedValueOnce({
        response: {
          candidates: [
            {
              content: {
                parts: [
                  /* empty parts */
                ],
                role: 'model',
              },
            },
          ], // No text, no function call
        },
      });

      await handleChat(req, res, mockAvailableFunctions, SYSTEM_INSTRUCTION, TOOLS_CONFIG);

      expect(conversationMemory.addModelTextResponse).toHaveBeenCalledWith(
        'test-empty-final',
        '[CuraAI: Não foi possível gerar uma resposta.]'
      );
      expect(res.json).toHaveBeenCalledWith({
        text: '[CuraAI: Não foi possível gerar uma resposta.]',
      });
    });

    it('should handle invalid response structure from AI service (no response object on first call)', async () => {
      req = mockRequest({ message: 'Test message', sessionId: 'test-invalid-struct-1' });
      const { generateContent } = await import('../../services/geminiService.js');

      generateContent.mockResolvedValueOnce(null); // Invalid: no response object

      await handleChat(req, res, mockAvailableFunctions, SYSTEM_INSTRUCTION, TOOLS_CONFIG);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error:
          'Error processing request: Invalid response structure from AI service (call 1). No response object.',
      });
    });

    it('should handle invalid response structure from AI service (no response object after function call)', async () => {
      req = mockRequest({ message: 'Test message func', sessionId: 'test-invalid-struct-2' });
      const { conversationMemory } = await import('../../services/memoryService.js');
      const { generateContent } = await import('../../services/geminiService.js');

      conversationMemory.getHistory.mockReturnValue([{}]); // Simplified

      // First call to Gemini: requests a function call
      generateContent.mockResolvedValueOnce({
        response: {
          candidates: [
            {
              content: {
                parts: [{ functionCall: { name: 'search_weather', args: { location: 'Moon' } } }],
                role: 'model',
              },
            },
          ],
        },
      });

      mockAvailableFunctions.search_weather.mockResolvedValueOnce({ result: { weather: 'dusty' } });

      // Second call to Gemini: returns invalid structure
      generateContent.mockResolvedValueOnce({ response: null }); // Invalid

      await handleChat(req, res, mockAvailableFunctions, SYSTEM_INSTRUCTION, TOOLS_CONFIG);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error:
          'Error processing request: Invalid response structure from AI service after function call (iteration 1).',
      });
    });

    it('should handle model response with no candidates', async () => {
      req = mockRequest({ message: 'No candidates please', sessionId: 'test-no-candidates' });
      const { conversationMemory } = await import('../../services/memoryService.js');
      const { generateContent } = await import('../../services/geminiService.js');

      conversationMemory.getHistory.mockReturnValueOnce([
        /* ... */
      ]);
      generateContent.mockResolvedValueOnce({
        response: {
          // No candidates array or empty candidates array
        },
      });

      await handleChat(req, res, mockAvailableFunctions, SYSTEM_INSTRUCTION, TOOLS_CONFIG);
      expect(conversationMemory.addModelTextResponse).toHaveBeenCalledWith(
        'test-no-candidates',
        '[CuraAI: Não foi possível gerar uma resposta.]'
      );
      expect(res.json).toHaveBeenCalledWith({
        text: '[CuraAI: Não foi possível gerar uma resposta.]',
      });
    });

    it('should handle model response with candidate but no content', async () => {
      req = mockRequest({ message: 'No content please', sessionId: 'test-no-content' });
      const { conversationMemory } = await import('../../services/memoryService.js');
      const { generateContent } = await import('../../services/geminiService.js');

      conversationMemory.getHistory.mockReturnValueOnce([
        /* ... */
      ]);
      generateContent.mockResolvedValueOnce({
        response: {
          candidates: [
            {
              /* no content object */
            },
          ],
        },
      });

      await handleChat(req, res, mockAvailableFunctions, SYSTEM_INSTRUCTION, TOOLS_CONFIG);
      expect(conversationMemory.addModelTextResponse).toHaveBeenCalledWith(
        'test-no-content',
        '[CuraAI: Não foi possível gerar uma resposta.]'
      );
      expect(res.json).toHaveBeenCalledWith({
        text: '[CuraAI: Não foi possível gerar uma resposta.]',
      });
    });

    it('should handle model response with candidate and content but no parts', async () => {
      req = mockRequest({ message: 'No parts please', sessionId: 'test-no-parts' });
      const { conversationMemory } = await import('../../services/memoryService.js');
      const { generateContent } = await import('../../services/geminiService.js');

      conversationMemory.getHistory.mockReturnValueOnce([
        /* ... */
      ]);
      generateContent.mockResolvedValueOnce({
        response: {
          candidates: [{ content: { /* no parts array */ role: 'model' } }],
        },
      });

      await handleChat(req, res, mockAvailableFunctions, SYSTEM_INSTRUCTION, TOOLS_CONFIG);
      expect(conversationMemory.addModelTextResponse).toHaveBeenCalledWith(
        'test-no-parts',
        '[CuraAI: Não foi possível gerar uma resposta.]'
      );
      expect(res.json).toHaveBeenCalledWith({
        text: '[CuraAI: Não foi possível gerar uma resposta.]',
      });
    });
  });

  describe('handleStreamChat', () => {
    // Initial basic tests for handleStreamChat
    it('should return 400 if message is not provided in stream', async () => {
      req = mockRequest({});
      await handleStreamChat(req, res, mockAvailableFunctions, SYSTEM_INSTRUCTION, TOOLS_CONFIG);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Message required' });
      expect(res.end).not.toHaveBeenCalled(); // Should not try to end stream if erroring early
    });

    it('should return 503 if AI service is not initialized for stream', async () => {
      const { isInitialized: mockIsInitialized } = await import('../../services/geminiService.js');
      mockIsInitialized.mockReturnValue(false);
      req = mockRequest({ message: 'Test stream message' });
      await handleStreamChat(req, res, mockAvailableFunctions, SYSTEM_INSTRUCTION, TOOLS_CONFIG);
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({ error: 'AI service not available.' });
      expect(res.end).not.toHaveBeenCalled();
    });

    it('should set appropriate headers for streaming', async () => {
      req = mockRequest({ message: 'Test stream headers', sessionId: 'stream-header-test' });
      const { generateContentStream } = await import('../../services/geminiService.js');

      // Mock generateContentStream to simulate an empty stream for header testing
      generateContentStream.mockImplementation(
        (async function* () {
          // Yield nothing to quickly finish the stream
        })()
      );

      await handleStreamChat(req, res, mockAvailableFunctions, SYSTEM_INSTRUCTION, TOOLS_CONFIG);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/x-ndjson');
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(res.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
      expect(res.end).toHaveBeenCalled(); // Stream should end even if empty
    });

    it('should stream a simple text response', async () => {
      req = mockRequest({ message: 'Hello stream', sessionId: 'stream-simple' });
      const { conversationMemory } = await import('../../services/memoryService.js');
      const { generateContentStream } = await import('../../services/geminiService.js');

      conversationMemory.getHistory.mockReturnValueOnce([
        { role: 'user', parts: [{ text: 'Hello stream' }] },
      ]);

      async function* mockStream() {
        yield { response: { candidates: [{ content: { parts: [{ text: 'Hi ' }] } }] } };
        yield { response: { candidates: [{ content: { parts: [{ text: 'there!' }] } }] } };
      }
      generateContentStream.mockReturnValueOnce(mockStream());

      await handleStreamChat(req, res, mockAvailableFunctions, SYSTEM_INSTRUCTION, TOOLS_CONFIG);

      expect(conversationMemory.addUserMessage).toHaveBeenCalledWith(
        'stream-simple',
        'Hello stream'
      );
      expect(generateContentStream).toHaveBeenCalledWith(
        expect.any(String),
        [{ role: 'user', parts: [{ text: 'Hello stream' }] }],
        SYSTEM_INSTRUCTION,
        TOOLS_CONFIG
      );

      expect(res.write).toHaveBeenCalledWith(JSON.stringify({ textChunk: 'Hi ' }));
      expect(res.write).toHaveBeenCalledWith(JSON.stringify({ textChunk: 'there!' }));
      expect(conversationMemory.addModelTextResponse).toHaveBeenCalledWith(
        'stream-simple',
        'Hi there!'
      );
      expect(res.end).toHaveBeenCalled();
    });

    // TODO: More complex stream tests:
    // - Stream with function call(s)
    // - Stream with errors from geminiService or function execution
    // - Stream reaching MAX_FUNCTION_CALLS
    // - Stream handling for multiple function calls in one model response (if applicable)
  });

  describe('clearSession', () => {
    it('should call memoryService.clearSession and return success', async () => {
      req = mockRequest({}, { sessionId: 'session-to-clear' });
      const { conversationMemory } = await import('../../services/memoryService.js');

      await clearSession(req, res);

      expect(conversationMemory.clearSession).toHaveBeenCalledWith('session-to-clear');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Session session-to-clear cleared successfully.',
      });
    });

    it('should use "default" sessionId if not provided for clearSession', async () => {
      req = mockRequest({}); // No sessionId in params
      const { conversationMemory } = await import('../../services/memoryService.js');

      await clearSession(req, res);

      expect(conversationMemory.clearSession).toHaveBeenCalledWith('default');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Session default cleared successfully.' });
    });
  });

  describe('getSessionHistory', () => {
    it('should retrieve and return session history', async () => {
      req = mockRequest({}, { sessionId: 'history-session' });
      const { conversationMemory } = await import('../../services/memoryService.js');
      const mockHistory = [
        { role: 'user', parts: [{ text: 'Hello' }] },
        { role: 'model', parts: [{ text: 'Hi there' }] },
      ];
      conversationMemory.getHistory.mockReturnValueOnce(mockHistory);

      await getSessionHistory(req, res);

      expect(conversationMemory.getHistory).toHaveBeenCalledWith('history-session');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ history: mockHistory });
    });

    it('should use "default" sessionId if not provided for getSessionHistory', async () => {
      req = mockRequest({});
      const { conversationMemory } = await import('../../services/memoryService.js');
      const mockHistory = [{ role: 'user', parts: [{ text: 'Test' }] }];
      conversationMemory.getHistory.mockReturnValueOnce(mockHistory);

      await getSessionHistory(req, res);

      expect(conversationMemory.getHistory).toHaveBeenCalledWith('default');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ history: mockHistory });
    });

    it('should return empty history if session does not exist or is empty', async () => {
      req = mockRequest({}, { sessionId: 'empty-session' });
      const { conversationMemory } = await import('../../services/memoryService.js');
      conversationMemory.getHistory.mockReturnValueOnce([]); // Empty history

      await getSessionHistory(req, res);

      expect(conversationMemory.getHistory).toHaveBeenCalledWith('empty-session');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ history: [] });
    });
  });
});
