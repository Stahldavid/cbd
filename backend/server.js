// server.js - Arquivo principal que conecta todos os módulos

// --- Importações de pacotes ---
import dotenv from 'dotenv';
dotenv.config(); // Carrega as variáveis de ambiente do .env

// --- Importações de módulos internos ---
import setupApp from './config/express.js';
import { setupCleanupInterval } from './services/memoryService.js';
import { initializeGeminiClient } from './services/geminiService.js';
import { buildSystemInstruction } from './config/systemInstructions.js';
import createApiRouter from './routes/apiRoutes.js';

// --- Importação de ferramentas ---
import { availableFunctions, allDeclarations } from './tools/index.js';

// --- Configuração de porta ---
const PORT = process.env.PORT || 3001;

// --- Inicialização ---
// Configura limpeza periódica de sessões (a cada hora)
setupCleanupInterval();

// Configuração para as ferramentas
const availableToolNames = Object.keys(availableFunctions);
const tools = allDeclarations.length > 0 ? [{ functionDeclarations: allDeclarations }] : undefined;

// Instruções do sistema para o modelo
const systemInstructionText = buildSystemInstruction(availableToolNames);

// Inicializa cliente Gemini
const geminiInitialized = initializeGeminiClient(availableToolNames);
if (!geminiInitialized) {
  console.error('[FATAL ERROR] Failed to initialize Gemini client. Exiting...');
  process.exit(1);
}

// Mostra informações sobre ferramentas
console.log('[INFO] Available tools:', availableToolNames.join(', ') || 'None');

// --- Configuração do Express App ---
const app = setupApp();

// Middleware to log all requests
app.use((req, res, next) => {
  console.log(`[REQUEST LOGGER] Incoming ${req.method} request to ${req.originalUrl}`);
  next();
});

// --- Rotas API ---
const apiRouter = createApiRouter(availableFunctions, systemInstructionText, tools);
app.use('/api', apiRouter);

// --- Inicialização do Servidor ---
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
//   console.log(`API endpoints:`);
//   console.log(`  - GET http://localhost:${PORT}/api/test`);
//   console.log(`  - POST http://localhost:${PORT}/api/chat (Function Calling Enabled)`);
//   console.log(`  - POST http://localhost:${PORT}/api/stream (Function Calling & Streaming Enabled)`);
//   console.log(`  - POST http://localhost:${PORT}/api/clear-session (Clear Conversation History)`);
//   if (process.env.NODE_ENV === 'development') {
//     console.log(`  - GET http://localhost:${PORT}/api/debug/session-history/:sessionId (Debug Only)`);
//   }
//   console.log(`\n--- Waiting for requests ---`);
// });

// Modify only the app.listen callback in server.js
// Replace the existing callback with this one

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  - GET http://localhost:${PORT}/api/test`);
  console.log(`  - POST http://localhost:${PORT}/api/chat (Function Calling Enabled)`);
  console.log(
    `  - POST http://localhost:${PORT}/api/stream (Function Calling & Streaming Enabled)`
  );
  console.log(`  - POST http://localhost:${PORT}/api/clear-session (Clear Conversation History)`);
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `  - GET http://localhost:${PORT}/api/debug/session-history/:sessionId (Debug Only)`
    );
  }

  // Token tracking info
  console.log(`\n--- Gemini Response Structure Debugging ---`);
  console.log(`Model: gemini-2.5-flash-preview-04-17`);
  console.log(`Token Structure Analysis: Enabled`);

  console.log(`\n--- Waiting for requests ---`);
});
