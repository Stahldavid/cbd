// middleware/authSupabase.js
// Middleware para verificação de tokens do Supabase

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config(); // Carrega as variáveis de ambiente do .env da pasta backend

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[AUTH FATAL] Missing Supabase environment variables for middleware. Ensure SUPABASE_URL and SUPABASE_SERVICE_KEY are in backend/.env');
  // Não queremos que o servidor inicie sem isso se o middleware for usado
  // process.exit(1); // Comentar ou tratar de forma diferente se o middleware puder ser opcional
}

// Criar uma instância do cliente Supabase ESPECÍFICA para este middleware
// Usamos a SERVICE_KEY aqui para ter a capacidade de verificar qualquer token de usuário
// e para a função requireDoctorRole poder consultar a tabela doctors.
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    // AutoRefreshToken e persistSession são mais relevantes para o cliente,
    // mas não prejudicam no backend e podem ser úteis se usar outras funções auth.
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

/**
 * Middleware para verificar tokens JWT do Supabase
 * Deve ser usado em rotas que exigem autenticação
 */
export const verifySupabaseToken = async (req, res, next) => {
  try {
    // Verifica se o cabeçalho de autorização existe
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[AUTH] Request missing valid Authorization header');
      return res.status(401).json({ 
        error: 'Não autorizado. Token não fornecido ou formato inválido.' 
      });
    }
    
    // Extrai o token do cabeçalho
    const token = authHeader.substring(7);
    
    // Verifica o token com o Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      console.warn('[AUTH] Token verification failed:', error?.message);
      return res.status(401).json({ 
        error: 'Não autorizado. Token inválido ou expirado.' 
      });
    }
    
    // Adiciona informações do usuário ao objeto da requisição
    req.user = data.user;
    
    // Continua para o próximo middleware ou rota
    next();
  } catch (error) {
    console.error('[AUTH] Exception in token verification middleware:', error);
    res.status(500).json({ 
      error: 'Erro no sistema de autenticação. Tente novamente mais tarde.' 
    });
  }
};

/**
 * Middleware para permitir acesso apenas a usuários com perfil de médico
 * Deve ser usado após o middleware verifySupabaseToken
 */
export const requireDoctorRole = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Usuário não autenticado.' 
      });
    }
    
    // Verifica se o usuário existe na tabela doctors
    const { data, error } = await supabase
      .from('doctors')
      .select('id')
      .eq('id', req.user.id)
      .single();
      
    if (error || !data) {
      console.warn('[AUTH] User not found in doctors table:', req.user.id);
      return res.status(403).json({ 
        error: 'Acesso negado. Permissão de médico necessária.' 
      });
    }
    
    // Usuário é um médico, continua
    next();
  } catch (error) {
    console.error('[AUTH] Exception in doctor role verification:', error);
    res.status(500).json({ 
      error: 'Erro no sistema de verificação de perfil. Tente novamente mais tarde.' 
    });
  }
};
