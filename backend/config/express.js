// config/express.js - Configuração do servidor Express

import express from 'express';
import cors from 'cors';

// Configura a aplicação Express
const setupApp = () => {
  const app = express();
  
  // Middlewares
  app.use(cors());
  app.use(express.json());
  
  return app;
};

export default setupApp;
