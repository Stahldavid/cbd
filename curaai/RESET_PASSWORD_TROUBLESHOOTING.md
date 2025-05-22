# 🔧 Troubleshooting Reset Password

## Se o problema persistir, siga estes passos:

### 1. Verificar Configuração Supabase

**Dashboard Supabase → Authentication → URL Configuration:**
```
Site URL: http://localhost:3000
Redirect URLs: 
  - http://localhost:3000/auth/reset-password
  - http://localhost:3000/**
```

### 2. Verificar Template de Email

**Dashboard Supabase → Authentication → Email Templates → Reset Password:**

Substitua o conteúdo por:
```html
<h2>Redefinir Senha</h2>
<p>Clique no link abaixo para redefinir sua senha:</p>
<a href="{{ .SiteURL }}/auth/reset-password?access_token={{ .Token }}&type=recovery&refresh_token={{ .RefreshToken }}">
  Redefinir Senha
</a>
<p>Este link expira em 1 hora.</p>
```

### 3. Teste Manual

1. Crie um usuário de teste no Dashboard do Supabase
2. Teste o reset password
3. Verifique os logs no console do navegador

### 4. URLs para Debug

- `/debug` - Testa conexão Supabase
- `/auth/simple-login` - Login sem AuthContext
- Console do navegador - Logs detalhados

### 5. Configurações de Desenvolvimento

Certifique-se de que o `.env` tem:
```
NEXT_PUBLIC_SUPABASE_URL="https://nyhbdaohvrlnlxuanwso.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[sua_key]"
```

### 6. Se Nada Funcionar

Teste com um link manual:
```
http://localhost:3000/auth/reset-password?access_token=FAKE_TOKEN&type=recovery&refresh_token=FAKE_REFRESH
```

Isso deve mostrar a página com debug info detalhado.
