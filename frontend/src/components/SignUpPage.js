import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient'; 
import { useNavigate, Link } from 'react-router-dom';

const SignUpPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState(''); 
    // const [crm, setCrm] = useState(''); // Exemplo para campos adicionais

    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const { signUp } = useAuth(); 
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const { data: authData, error: authError } = await signUp({
                email,
                password,
                options: { data: { full_name: name } } // Salvando nome no metadata do usuário
            });

            if (authError) throw authError;

            if (authData.user) {
                // Dados do perfil a serem inseridos
                const profileData = {
                    id: authData.user.id, 
                    email: authData.user.email, 
                    name: name,
                    updated_at: new Date().toISOString(),
                };

                // Verificamos se o perfil já existe
                const { data: existingProfile, error: fetchError } = await supabase
                    .from('doctors')
                    .select('id')
                    .eq('id', authData.user.id)
                    .single();

                // Se não encontrar o perfil, tentamos criá-lo
                if (!existingProfile && !fetchError) {
                    // Primeira tentativa: esperar um pouco para a autenticação propagar
                    setTimeout(async () => {
                        const { error: profileError } = await supabase
                            .from('doctors')
                            .insert([profileData]);

                        if (profileError) {
                            console.error("Erro ao criar perfil do médico na tabela 'doctors':", profileError);
                            
                            // Segunda tentativa: usar função de inserção serverless (recomendada)
                            // Esta seria a abordagem ideal, mas exige configurar uma Edge Function no Supabase
                            // Alternativamente, implemente um endpoint em seu backend para fazer esta inserção

                            setError(`Usuário de autenticação criado, mas falha ao criar perfil: ${profileError.message}. O administrador precisará criar seu perfil.`);
                        } else {
                            setMessage('Cadastro realizado! Verifique seu e-mail para confirmar sua conta antes de fazer login.');
                        }
                    }, 1000); // Esperar 1 segundo para a autenticação propagar
                } else {
                    setMessage('Cadastro realizado! Verifique seu e-mail para confirmar sua conta antes de fazer login.');
                }
            } else if (authData.session) {
                 setMessage('Você já está cadastrado e logado.');
                 navigate('/');
            } else {
                 setMessage('Cadastro enviado! Verifique seu e-mail para confirmar sua conta.');
            }

        } catch (error) {
            console.error("Erro no cadastro:", error);
            setError(error.message);
        }
        setLoading(false);
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Cadastro de Médico</h2>
            {message && <p style={{ color: 'green', marginBottom: '15px', textAlign: 'center' }}>{message}</p>}
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="name" style={{ display: 'block', marginBottom: '5px' }}>Nome Completo:</label>
                    <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ddd' }} />
                </div>
                {/* Inputs para CRM, Especialidade podem ser adicionados aqui */}
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
                    <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ddd' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>Senha (mínimo 6 caracteres):</label>
                    <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ddd' }}/>
                </div>

                {error && <p style={{ color: 'red', marginBottom: '15px', textAlign: 'center' }}>{error}</p>}
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}>
                    {loading ? 'Cadastrando...' : 'Cadastrar'}
                </button>
            </form>
            <p style={{ marginTop: '20px', textAlign: 'center' }}>
                Já tem uma conta? <Link to="/login" style={{ color: '#007bff', textDecoration: 'none' }}>Faça login aqui</Link>
            </p>
        </div>
    );
};
export default SignUpPage; 