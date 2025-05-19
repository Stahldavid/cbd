import {
  initializeGeminiClient,
  generateContent,
  generateContentStream,
  isInitialized,
} from '../../services/geminiService.js'; // Adjusted path

// Mock the entire @google/genai module
const mockInternalGenerateContent = jest.fn();
const mockInternalGenerateContentStream = jest.fn();

// This is the constructor mock for GoogleGenAI
const mockGoogleGenAIConstructor = jest.fn().mockImplementation(() => ({
  // Mocks for instance.getGenerativeModel().generateContent, etc.
  // In your geminiService, you are using genAI.models.generateContent directly.
  models: {
    generateContent: mockInternalGenerateContent,
    generateContentStream: mockInternalGenerateContentStream,
  },
}));

jest.mock('@google/genai', () => ({
  __esModule: true, // If it's an ES module
  // Default export (if GoogleGenAI is a default export from the package, though it's usually named)
  // default: mockGoogleGenAIConstructor,
  // Named export
  GoogleGenAI: mockGoogleGenAIConstructor,
}));

describe('Gemini Service', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    mockGoogleGenAIConstructor.mockClear();
    mockInternalGenerateContent.mockClear();
    mockInternalGenerateContentStream.mockClear();
    // Forcing re-initialization of the service's internal state for tests
    // This is a bit of a workaround because genAI is a module-level variable.
    // A better way would be if geminiService exposed a reset function or was class-based.
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      initializeGeminiClient([]); // Re-initialize if key exists to reset internal genAI
    } else {
      // Manually ensure genAI is null if no API key for tests that expect it to be uninitialized
      // This requires ability to set genAI to null, which isn't directly exposed. initializeGeminiClient(false) should make it null.
      initializeGeminiClient(null); // Attempt to make it uninitialized by passing invalid param that causes it to fail initialization
    }
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('initializeGeminiClient', () => {
    test('should initialize GoogleGenAI with API key and return true', () => {
      process.env.GEMINI_API_KEY = 'test-api-key';
      const result = initializeGeminiClient([]);
      expect(mockGoogleGenAIConstructor).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
      expect(result).toBe(true);
      expect(isInitialized()).toBe(true);
    });

    test('should return false and log error if API key is missing', () => {
      delete process.env.GEMINI_API_KEY;
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const result = initializeGeminiClient([]);
      expect(result).toBe(false);
      expect(isInitialized()).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '[FATAL ERROR] Failed to initialize Gemini Client: GEMINI_API_KEY environment variable not set.'
        )
      );
      consoleErrorSpy.mockRestore();
    });

    test('should warn if TAVILY_API_KEY is missing and tavily_search tool is present', () => {
      process.env.GEMINI_API_KEY = 'test-api-key';
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      initializeGeminiClient(['tavily_search']); // tools array directly
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("[AVISO] Variável de ambiente 'TAVILY_API_KEY' não definida.")
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe('generateContent & generateContentStream common error', () => {
    test('generateContent should throw error if client not initialized', async () => {
      delete process.env.GEMINI_API_KEY;
      initializeGeminiClient(null); // Ensure it fails initialization
      await expect(generateContent('m', [], 's', [])).rejects.toThrow(
        'Gemini client not initialized'
      );
    });

    test('generateContentStream should throw error if client not initialized', async () => {
      delete process.env.GEMINI_API_KEY;
      initializeGeminiClient(null); // Ensure it fails initialization
      await expect(generateContentStream('m', [], 's', [])).rejects.toThrow(
        'Gemini client not initialized'
      );
    });
  });

  describe('generateContent', () => {
    beforeEach(() => {
      process.env.GEMINI_API_KEY = 'test-api-key';
      initializeGeminiClient([]);
    });

    test('should call genAI.models.generateContent with correct parameters structure', async () => {
      const model = 'gemini-pro';
      const contents = [{ role: 'user', parts: [{ text: 'Hello' }] }];
      const systemInstructionText = 'Be a helpful assistant';
      const toolsConfig = [{ functionDeclarations: [{ name: 'testTool' }] }];
      const mockApiResponse = { response: { text: () => 'Hi' } };
      mockInternalGenerateContent.mockResolvedValue(mockApiResponse);

      const result = await generateContent(model, contents, systemInstructionText, toolsConfig);

      expect(mockInternalGenerateContent).toHaveBeenCalledWith({
        model: model,
        contents: contents,
        config: {
          systemInstruction: { parts: [{ text: systemInstructionText }] },
          tools: toolsConfig,
        },
      });
      expect(result).toBe(mockApiResponse);
    });
  });

  describe('generateContentStream', () => {
    beforeEach(() => {
      process.env.GEMINI_API_KEY = 'test-api-key';
      initializeGeminiClient([]);
    });

    test('should call genAI.models.generateContentStream with correct parameters structure', async () => {
      const model = 'gemini-pro';
      const contents = [{ role: 'user', parts: [{ text: 'Hello stream' }] }];
      const systemInstructionText = 'Be a streamy assistant';
      const toolsConfig = [{ functionDeclarations: [{ name: 'streamTool' }] }];
      const mockStreamResponse = { stream: 'mock stream data', response: Promise.resolve({}) };
      mockInternalGenerateContentStream.mockResolvedValue(mockStreamResponse);

      const result = await generateContentStream(
        model,
        contents,
        systemInstructionText,
        toolsConfig
      );
      expect(mockInternalGenerateContentStream).toHaveBeenCalledWith({
        model: model,
        contents: contents,
        config: {
          systemInstruction: { parts: [{ text: systemInstructionText }] },
          tools: toolsConfig,
        },
      });
      expect(result).toBe(mockStreamResponse);
    });
  });
}); 