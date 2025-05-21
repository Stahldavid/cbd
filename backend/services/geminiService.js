// // services/geminiService.js - Configuração do cliente Gemini

// import pkg from '@google/genai';
// const { GoogleGenAI } = pkg;

// // --- Gemini Client Initialization ---
// let genAI = null;

// // Inicializa o cliente Gemini
// const initializeGeminiClient = (tools) => {
//   try {
//     const apiKey = process.env.GEMINI_API_KEY;
//     if (!apiKey) throw new Error('GEMINI_API_KEY environment variable not set.');

//     genAI = new GoogleGenAI({ apiKey: apiKey });
//     console.log('Gemini Client Initialized successfully');

//     if (!process.env.TAVILY_API_KEY && tools.includes('tavily_search')) {
//       console.warn(
//         "\n[AVISO] Variável de ambiente 'TAVILY_API_KEY' não definida. A função tavily_search não funcionará sem ela."
//       );
//     }

//     return true;
//   } catch (error) {
//     console.error(`[FATAL ERROR] Failed to initialize Gemini Client: ${error.message}`);
//     if (error.stack) {
//       console.error(error.stack);
//     }
//     return false;
//   }
// };

// // Gera conteúdo usando a API Gemini
// const generateContent = async (model, contents, systemInstruction, tools) => {
//   if (!genAI) {
//     throw new Error('Gemini client not initialized');
//   }

//   return await genAI.models.generateContent({
//     model: model,
//     contents: contents,
//     config: {
//       systemInstruction: { parts: [{ text: systemInstruction }] },
//       tools: tools,
//     },
//   });
// };

// // Gera conteúdo em streaming usando a API Gemini
// const generateContentStream = async (model, contents, systemInstruction, tools) => {
//   if (!genAI) {
//     throw new Error('Gemini client not initialized');
//   }

//   return await genAI.models.generateContentStream({
//     model: model,
//     contents: contents,
//     config: {
//       systemInstruction: { parts: [{ text: systemInstruction }] },
//       tools: tools,
//     },
//   });
// };

// // Verifica se o cliente está inicializado
// const isInitialized = () => {
//   return genAI !== null;
// };

// export { initializeGeminiClient, generateContent, generateContentStream, isInitialized };



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
    console.error('[geminiService] Gemini client not initialized attempted to call generateContent.');
    return { 
      error: 'Gemini client not initialized', 
      details: 'The AI service could not be reached because it was not properly started.'
    };
  }

  try {
    console.log(`[geminiService] Calling genAI.models.generateContent with model: ${model}`);
    // console.log('[geminiService] Contents:', JSON.stringify(contents, null, 2));
    // console.log('[geminiService] System Instruction:', systemInstruction);
    // console.log('[geminiService] Tools:', tools);

    const apiResult = await genAI.models.generateContent({
      model: model,
      contents: contents,
      systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
      tools: tools,
    });
    
    // O SDK do @google/genai já retorna um objeto que inclui `response`.
    // A promessa de genAI.models.generateContent resolve para um GenerateContentResponse
    // que tem uma propriedade `response`.
    // Na verdade, o objeto retornado por `await genAI.models.generateContent` é o próprio `GenerateContentResponse`
    // que o chatController espera como `result.response` (ou seja, result.response.candidates...)
    // Então, o `result` do chatController é o `apiResult` aqui.
    // O que o controller espera é que `result.response` seja o objeto com `candidates`.
    // O SDK retorna: { response: { candidates: [...], promptFeedback... } }
    // Então, o `apiResult` aqui é o objeto que contém a propriedade `response`.
    
    // Se a chamada for bem-sucedida, a estrutura já deve ser a esperada pelo chatController
    // onde `apiResult` é o objeto que tem a propriedade `response`.
    // Ex: apiResult = { response: { candidates: [...], ... } }
    // Então, no chatController, `result` será `apiResult`, e `result.response` estará correto.
    console.log('[geminiService] genAI.models.generateContent call successful.');
    // console.log('[geminiService] API Result:', JSON.stringify(apiResult, null, 2));
    return apiResult; // Retorna o resultado completo da API

  } catch (error) {
    console.error('[geminiService] Error calling genAI.models.generateContent:', error);
    // Tentar extrair informações mais detalhadas do erro da API do Gemini, se disponíveis
    let errorMessage = 'Failed to generate content from AI service.';
    let errorDetails = error.message; // Mensagem de erro genérica

    if (error.response && error.response.data) {
        // Se o erro tem uma estrutura de resposta da API (ex: erro de validação do Gemini)
        console.error('[geminiService] Gemini API Error Response Data:', error.response.data);
        errorDetails = error.response.data.error?.message || JSON.stringify(error.response.data);
    } else if (error.message) {
        errorDetails = error.message;
    }

    // Retornar um objeto de erro consistente
    return {
      error: errorMessage,
      details: errorDetails,
      // Poderia adicionar um campo para indicar que isso é um erro da API, ex: isGeminiError: true
    };
  }
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
