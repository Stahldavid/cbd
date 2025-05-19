// frontend/src/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from './supabaseClient'; // Importe o cliente configurado

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loadingAuthState, setLoadingAuthState] = useState(true);

    useEffect(() => {
        const getSession = async () => {
            try {
                const { data: { session: currentSession } } = await supabase.auth.getSession();
                setSession(currentSession);
                setUser(currentSession?.user ?? null);
            } catch (error) {
                console.error("Erro ao buscar sessão inicial:", error);
            } finally {
                setLoadingAuthState(false);
            }
        };

        getSession();

        // Escuta mudanças no estado de autenticação (login, logout)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, newSession) => {
                setSession(newSession);
                setUser(newSession?.user ?? null);
                setLoadingAuthState(false); // Garante que o loading é atualizado após qualquer mudança
            }
        );

        // Limpa o listener quando o componente é desmontado
        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    // Funções para interagir com Supabase Auth
    const value = {
        signUp: (data) => supabase.auth.signUp(data),
        signIn: (data) => supabase.auth.signInWithPassword(data),
        signOut: () => supabase.auth.signOut(),
        user,
        session,
        loadingAuthState, // Exporta o estado de loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook customizado para usar o contexto de autenticação
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
}; 