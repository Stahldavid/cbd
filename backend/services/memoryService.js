// services/memoryService.js - Sistema de Memória de Conversas

// --- Sistema de Memória de Conversas ---
const conversationMemory = {
  // Um objeto que armazena sessões de conversa
  sessions: {},

  // Inicializa ou reinicia uma sessão
  initSession(sessionId) {
    this.sessions[sessionId] = {
      history: [],
      lastUpdate: Date.now(),
    };
    console.log(`[Memory] Initialized new session: ${sessionId}`);
    return this.sessions[sessionId];
  },

  // Obtém uma sessão existente ou cria uma nova
  getSession(sessionId) {
    if (!this.sessions[sessionId]) {
      return this.initSession(sessionId);
    }
    return this.sessions[sessionId];
  },

  // Adiciona um turno de usuário à sessão
  addUserMessage(sessionId, message) {
    const session = this.getSession(sessionId);
    const userTurn = {
      role: 'user',
      parts: [{ text: message }],
    };

    session.history.push(userTurn);
    session.lastUpdate = Date.now();
    console.log(
      `[Memory] Added user message to session ${sessionId}, history length: ${session.history.length}`
    );
    return userTurn;
  },

  // Adiciona um turno de modelo com resposta de texto à sessão
  addModelTextResponse(sessionId, text) {
    const session = this.getSession(sessionId);
    const modelTurn = {
      role: 'model',
      parts: [{ text: text }],
    };

    session.history.push(modelTurn);
    session.lastUpdate = Date.now();
    console.log(
      `[Memory] Added model text response to session ${sessionId}, history length: ${session.history.length}`
    );
    return modelTurn;
  },

  // Adiciona uma chamada de função à sessão
  addFunctionCall(sessionId, name, args) {
    const session = this.getSession(sessionId);
    const functionCallTurn = {
      role: 'model',
      parts: [
        {
          functionCall: {
            name: name,
            args: args,
          },
        },
      ],
    };

    session.history.push(functionCallTurn);
    session.lastUpdate = Date.now();
    console.log(
      `[Memory] Added function call (${name}) to session ${sessionId}, history length: ${session.history.length}`
    );
    return functionCallTurn;
  },

  // Adiciona um resultado de função à sessão
  addFunctionResult(sessionId, name, result) {
    const session = this.getSession(sessionId);
    const functionResultTurn = {
      role: 'user',
      parts: [
        {
          functionResponse: {
            name: name,
            response: result,
          },
        },
      ],
    };

    session.history.push(functionResultTurn);
    session.lastUpdate = Date.now();
    console.log(
      `[Memory] Added function result (${name}) to session ${sessionId}, history length: ${session.history.length}`
    );
    return functionResultTurn;
  },

  // Obtém o histórico completo para a API Gemini
  getHistory(sessionId) {
    const session = this.getSession(sessionId);
    return [...session.history];
  },

  // Limpa sessões antigas (pode ser executado periodicamente)
  cleanup(maxAgeMs = 1000 * 60 * 60 * 24) {
    // Por padrão 24 horas
    const now = Date.now();
    let count = 0;
    Object.keys(this.sessions).forEach((sessionId) => {
      if (now - this.sessions[sessionId].lastUpdate > maxAgeMs) {
        delete this.sessions[sessionId];
        count++;
      }
    });
    if (count > 0) {
      console.log(`[Memory] Cleaned up ${count} inactive sessions`);
    }
    return count;
  },
};

// Inicia limpeza periódica
const setupCleanupInterval = () => {
  setInterval(() => conversationMemory.cleanup(), 1000 * 60 * 60);
};

export { conversationMemory, setupCleanupInterval };
