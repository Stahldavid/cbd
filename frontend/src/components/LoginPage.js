import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendingEmail, setResendingEmail] = useState(false);
    const { signIn } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);
        try {
            const { error: signInError } = await signIn({ email, password });
            if (signInError) throw signInError;
            navigate('/'); // Redireciona para a página principal após o login
        } catch (signInError) {
            console.error("Erro no login:", signInError);
            
            // Verifica se o erro é de email não confirmado
            if (signInError.message.includes("Email not confirmed") || 
                signInError.message.includes("email not confirmed")) {
                setError("Email não confirmado. Por favor, verifique seu email ou clique abaixo para reenviar o link de confirmação.");
            } else {
                setError(signInError.message);
            }
        }
        setLoading(false);
    };

    const handleResendConfirmation = async () => {
        if (!email) {
            setError("Por favor, digite seu email para reenviar a confirmação.");
            return;
        }

        setResendingEmail(true);
        setError('');
        setMessage('');

        try {
            // Usa a API do Supabase para reenviar o email de confirmação
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email
            });

            if (error) throw error;
            
            setMessage("Email de confirmação reenviado! Por favor, verifique sua caixa de entrada.");
        } catch (resendError) {
            console.error("Erro ao reenviar email de confirmação:", resendError);
            setError(`Não foi possível reenviar o email: ${resendError.message}`);
        } finally {
            setResendingEmail(false);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Login</h2>
            {message && <p style={{ color: 'green', marginBottom: '15px', textAlign: 'center' }}>{message}</p>}
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
                    <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ddd' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>Senha:</label>
                    <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ddd' }}/>
                </div>
                {error && <p style={{ color: 'red', marginBottom: '15px', textAlign: 'center'  }}>{error}</p>}
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}>
                    {loading ? 'Entrando...' : 'Entrar'}
                </button>
                
                {error && error.includes("não confirmado") && (
                    <button 
                        type="button" 
                        onClick={handleResendConfirmation}
                        disabled={resendingEmail}
                        style={{ 
                            width: '100%', 
                            marginTop: '10px',
                            padding: '10px', 
                            backgroundColor: '#28a745', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px', 
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        {resendingEmail ? 'Reenviando...' : 'Reenviar email de confirmação'}
                    </button>
                )}
            </form>
            <p style={{ marginTop: '20px', textAlign: 'center' }}>
                Não tem uma conta? <Link to="/signup" style={{ color: '#007bff', textDecoration: 'none' }}>Cadastre-se aqui</Link>
            </p>
        </div>
    );
};
export default LoginPage; 