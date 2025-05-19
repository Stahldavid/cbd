// routes/apiRoutes.js - Definição de rotas da API

import express from 'express';
import {
  handleChat,
  handleStreamChat,
  clearSession,
  getSessionHistory,
} from '../controllers/chatController.js';
import { conversationMemory } from '../services/memoryService.js';
import { verifySupabaseToken } from '../middleware/authSupabase.js';
import { generateContent } from '../services/geminiService.js';

console.log('[DEBUG] apiRoutes.js: File loaded and router creation started.');

const MODEL_NAME = 'gemini-2.5-flash-preview-04-17';

// Cria o roteador Express
const createRouter = (availableFunctions, systemInstructionText, tools) => {
  const router = express.Router();
  console.log('[DEBUG] apiRoutes.js: Express router instance created.');

  // Middleware to log requests specifically to this router
  router.use((req, res, next) => {
    console.log(`[API ROUTER LOGGER] Router received ${req.method} request for ${req.url} (original: ${req.originalUrl})`);
    next();
  });

  // Rota de teste pública
  router.get('/test', (req, res) => {
    res.json({
      status: "success",
      message: "API is working correctly",
      timestamp: new Date().toISOString()
    });
  });

  // Rota para chat normal
  router.post('/chat', verifySupabaseToken, (req, res, next) => {
    handleChat(req, res, availableFunctions, systemInstructionText, tools).catch(next); 
  });

  // Rota para streaming
  router.post('/stream', verifySupabaseToken, (req, res, next) => {
    handleStreamChat(req, res, availableFunctions, systemInstructionText, tools).catch(next); 
  });

  // Rota para limpar sessão
  router.post('/clear-session', verifySupabaseToken, clearSession);

  // Rota para obter o histórico da sessão (para persistência no frontend)
  router.get('/session-history', verifySupabaseToken, getSessionHistory);
  router.get('/session-history/:sessionId', verifySupabaseToken, getSessionHistory);

  // Nova rota para sumarizar uma consulta específica
  console.log('[DEBUG] apiRoutes.js: Defining route POST /api/summarize-consultation');
  router.post('/summarize-consultation', verifySupabaseToken, async (req, res, next) => {
    try {
      const { consultation_text } = req.body;
      if (!consultation_text) {
        return res.status(400).json({ success: false, error: 'consultation_text is required.' });
      }

      const systemPrompt = `Você é um assistente médico especializado em resumir transcrições de consultas.
      Resuma o seguinte texto da consulta de forma concisa e objetiva, destacando os pontos principais, queixas, diagnósticos (se houver) e planos de tratamento.
      O resumo deve ser útil para referência rápida do médico.`;
      
      const contents = [{ role: 'user', parts: [{ text: consultation_text }] }];
      
      const result = await generateContent(MODEL_NAME, contents, systemPrompt, null);
      
      let summaryText = '';
      if (result && result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts[0]) {
        summaryText = result.candidates[0].content.parts[0].text;
      } else if (result && typeof result.text === 'function') {
        summaryText = result.text();
      }
      
      if (!summaryText) {
         console.error('[ERROR] summarize-consultation: Failed to extract summary text from Gemini response. Response:', JSON.stringify(result, null, 2));
         throw new Error('Failed to extract summary text from AI response.');
      }

      res.json({ success: true, summary: summaryText });

    } catch (error) {
      console.error('[ERROR] In /summarize-consultation route:', error);
      res.status(500).json({ success: false, error: error.message || 'Internal server error during consultation summarization.' });
    }
  });

  // Rota de depuração (apenas em ambiente de desenvolvimento)
  if (process.env.NODE_ENV === 'development') {
    router.get('/debug/session-history/:sessionId', getSessionHistory);
  }

  return router;
};

export default createRouter;
