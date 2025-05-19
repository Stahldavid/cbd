import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config(); // Para carregar variáveis de ambiente do backend/.env

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;

if (!supabaseUrl) {
    console.error("Variável de ambiente SUPABASE_URL não definida no backend/.env");
    // Considerar lançar um erro aqui para impedir que o servidor inicie sem configuração adequada
    // throw new Error("SUPABASE_URL não está definida para o middleware de autenticação.");
}

if (!supabaseJwtSecret) {
    console.error("Variável de ambiente SUPABASE_JWT_SECRET não definida no backend/.env");
}

export const verifySupabaseToken = (req, res, next) => {
    console.log('[verifySupabaseToken] Middleware entered.');
    console.log(`[verifySupabaseToken] SUPABASE_URL is: ${supabaseUrl ? supabaseUrl : 'NOT SET'}`);
    console.log(`[verifySupabaseToken] SUPABASE_JWT_SECRET is: ${supabaseJwtSecret ? '********' : 'NOT SET'}`);
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('[verifySupabaseToken] Auth header missing or malformed.');
        return res.status(401).json({ message: 'Token de autorização ausente ou mal formatado.' });
    }

    const token = authHeader.split(' ')[1];
    console.log(`[verifySupabaseToken] Token received (first 10 chars): ${token.substring(0, 10)}...`);

    const jwtOptions = {
        audience: 'authenticated',
        issuer: `${supabaseUrl}/auth/v1`,
        algorithms: ['HS256']
    };
    console.log('[verifySupabaseToken] JWT options prepared:', jwtOptions);

    try {
        console.log('[verifySupabaseToken] Attempting jwt.verify...');
        const decoded = jwt.verify(token, supabaseJwtSecret, jwtOptions);
        req.user = { id: decoded.sub, ...decoded };
        console.log('[verifySupabaseToken] JWT verified successfully. Decoded sub:', decoded.sub, 'Calling next().');
        next();
    } catch (err) {
        console.error('[verifySupabaseToken] Falha na verificação do JWT Supabase:', err.message);
        console.error('[verifySupabaseToken] JWT Error Name:', err.name);
        console.error('[verifySupabaseToken] JWT Error Stack:', err.stack);
        console.error('[verifySupabaseToken] Full JWT Error Object:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
        return res.status(401).json({ message: 'Token inválido ou expirado.', errorName: err.name, errorMessage: err.message });
    }
}; 