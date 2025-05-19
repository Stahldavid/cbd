// services/geminiService.js - Configuração do cliente Gemini

import pkg from '@google/genai';
const { GoogleGenAI } = pkg;

// --- Gemini Client Initialization ---
let genAI = null;

// Inicializa o cliente Gemini
const initializeGeminiClient = (tools) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY environment variable not set.');

    genAI = new GoogleGenAI({ apiKey: apiKey });
    console.log('Gemini Client Initialized successfully');

    if (!process.env.TAVILY_API_KEY && tools.includes('tavily_search')) {
      console.warn(
        "\n[AVISO] Variável de ambiente 'TAVILY_API_KEY' não definida. A função tavily_search não funcionará sem ela."
      );
    }

    return true;
  } catch (error) {
    console.error(`[FATAL ERROR] Failed to initialize Gemini Client: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    return false;
  }
};

// Gera conteúdo usando a API Gemini
const generateContent = async (model, contents, systemInstruction, tools) => {
  if (!genAI) {
    throw new Error('Gemini client not initialized');
  }

  return await genAI.models.generateContent({
    model: model,
    contents: contents,
    config: {
      systemInstruction: { parts: [{ text: systemInstruction }] },
      tools: tools,
    },
  });
};

// Gera conteúdo em streaming usando a API Gemini
const generateContentStream = async (model, contents, systemInstruction, tools) => {
  if (!genAI) {
    throw new Error('Gemini client not initialized');
  }

  return await genAI.models.generateContentStream({
    model: model,
    contents: contents,
    config: {
      systemInstruction: { parts: [{ text: systemInstruction }] },
      tools: tools,
    },
  });
};

// Verifica se o cliente está inicializado
const isInitialized = () => {
  return genAI !== null;
};

export { initializeGeminiClient, generateContent, generateContentStream, isInitialized };
