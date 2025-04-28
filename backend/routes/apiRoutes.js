// routes/apiRoutes.js - Definição de rotas da API

import express from 'express';
import { handleChat, handleStreamChat, clearSession, getSessionHistory } from '../controllers/chatController.js';
import { conversationMemory } from '../services/memoryService.js';

// Cria o roteador Express
const createRouter = (availableFunctions, systemInstructionText, tools) => {
  const router = express.Router();

  // Rota de teste básico
  router.get('/test', (req, res) => res.json({ message: 'Streaming server running!' }));

  // Rota para chat normal
  router.post('/chat', (req, res) => handleChat(req, res, availableFunctions, systemInstructionText, tools));

  // Rota para streaming
  router.post('/stream', (req, res) => handleStreamChat(req, res, availableFunctions, systemInstructionText, tools));

  // Rota para limpar sessão
  router.post('/clear-session', clearSession);

  // Rota para obter o histórico da sessão (para persistência no frontend)
  router.get('/session-history/:sessionId', (req, res) => {
    const sessionId = req.params.sessionId;
    const session = conversationMemory.getSession(sessionId);
    const history = session.history;
    
    // Transforma o formato interno do histórico para um formato mais amigável para o frontend
    const formattedHistory = [];
    
    for (let i = 0; i < history.length; i++) {
      const item = history[i];
      
      // Mensagem do usuário (texto simples)
      if (item.role === 'user' && item.parts && item.parts.length === 1 && item.parts[0].text) {
        formattedHistory.push({
          id: `restored-user-${i}`,
          text: item.parts[0].text,
          sender: 'user',
          timestamp: new Date(),
          type: 'user',
          isComplete: true
        });
      }
      // Resposta do modelo (texto simples)
      else if (item.role === 'model' && item.parts && item.parts.length === 1 && item.parts[0].text) {
        formattedHistory.push({
          id: `restored-ai-${i}`,
          text: item.parts[0].text,
          sender: 'ai',
          timestamp: new Date(),
          type: 'ai',
          isComplete: true
        });
      }
      // Chamada de função
      else if (item.role === 'model' && item.parts && item.parts.length === 1 && item.parts[0].functionCall) {
        const functionCall = item.parts[0].functionCall;
        formattedHistory.push({
          id: `restored-fc-${i}`,
          type: 'functionCall',
          sender: 'ai',
          timestamp: new Date(),
          functionCallInfo: {
            name: functionCall.name,
            args: functionCall.args
          },
          text: `🔧 Chamando Função: ${functionCall.name}\n${JSON.stringify(functionCall.args, null, 2)}`
        });
      }
      // Resultado de função
      else if (item.role === 'user' && item.parts && item.parts.length === 1 && item.parts[0].functionResponse) {
        const functionResponse = item.parts[0].functionResponse;
        formattedHistory.push({
          id: `restored-fr-${i}`,
          type: 'functionResult',
          sender: 'ai',
          timestamp: new Date(),
          functionResultInfo: {
            name: functionResponse.name,
            result: functionResponse.response
          },
          text: `✅ Resultado (${functionResponse.name}):\n${JSON.stringify(functionResponse.response, null, 2)}`
        });
      }
    }
    
    res.json({ success: true, history: formattedHistory });
  });

  // Rota de depuração (apenas em ambiente de desenvolvimento)
  if (process.env.NODE_ENV === 'development') {
    router.get('/debug/session-history/:sessionId', getSessionHistory);
  }

  return router;
};

export default createRouter;
