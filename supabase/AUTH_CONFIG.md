# Supabase Auth — configuração de produção

Lista das opções que precisam estar corretas no dashboard Supabase
(Project → Authentication) para que login, OAuth, magic link e
password reset funcionem. O código da app aceita tanto o formato
PKCE (`?code=`) quanto OTP (`?token_hash=&type=`) em `/auth/callback`
e `/auth/confirm`, mas o dashboard precisa bater com uma delas.

Se o magic link "não funciona", a causa quase sempre é uma dessas
opções divergindo do esperado.

## 1. URL Configuration

Project Settings → Authentication → URL Configuration:

- **Site URL**: `https://veritasdei.com.br`
  (sem trailing slash, sem `/auth/*` sufixo)

- **Redirect URLs** (allowlist — adicione TODAS):
  ```
  https://veritasdei.com.br/auth/callback
  https://veritasdei.com.br/auth/callback?next=*
  https://veritasdei.com.br/auth/confirm
  https://veritasdei.com.br/auth/confirm?next=*
  https://veritasdei.com.br/perfil/seguranca
  https://veritasdei.com.br/onboarding
  https://veritasdei.com.br/
  ```
  Também inclua o preview do Vercel se usar:
  ```
  https://veritasdei-*.vercel.app/auth/callback
  https://veritasdei-*.vercel.app/auth/confirm
  ```

## 2. Email Providers

Authentication → Providers → **Email**:

- [x] Enable Email provider
- [x] **Confirm email** — OBRIGATÓRIO. Sem isso, qualquer bot cria
      conta sem validar endereço e queima sua cota de OpenAI.
- [x] Secure email change — recomendado
- [x] Secure password change — recomendado

## 3. Password policy

Authentication → Providers → Email → Password requirements:

- Minimum length: **10** (o código client-side pede 8, mas o servidor
  aceitava 6 por padrão — aumente)
- Require uppercase / lowercase / number / symbol: opcional, a critério
  do produto

## 4. Email templates

Authentication → Email Templates. O código aceita qualquer um dos dois
formatos abaixo para cada template — use o que for mais limpo no email.

### Magic Link
Default Supabase já manda:
```
{{ .ConfirmationURL }}
```
que resolve para:
```
https://<project>.supabase.co/auth/v1/verify?token=...&type=magiclink&redirect_to=https://veritasdei.com.br/auth/callback
```
Supabase verifica o token e redireciona com um `?code=` (PKCE) para
`/auth/callback`. Funciona.

Alternativa (mais explícita):
```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink&next=/">Entrar</a>
```

### Signup / Confirm Email
Funciona com qualquer um dos dois formatos acima.

### Password Recovery
```html
<a href="{{ .SiteURL }}/auth/callback?next=/perfil/seguranca">Redefinir senha</a>
```
(o token já vai no fragmento da URL por padrão do Supabase; o callback
pega).

## 5. Rate limits

Authentication → Rate Limits — Supabase default é razoável. Se houver
muita fricção reporte caso-a-caso.

## 6. Smoke test após qualquer mudança

```bash
# Magic link
# 1. /login → aba "Link por e-mail" → insira email → envia
# 2. Cheque inbox — link deve chegar em <1 min
# 3. Click → deve aterrissar em / (ou em nextPath se foi usado)
# 4. Cookie de sessão seta corretamente

# Signup
# 1. /login → aba "Cadastrar" → preenche → submete
# 2. Inbox recebe "Confirm your email"
# 3. Click → aterrissa em /perfil/seguranca (primeiro fluxo) ou /onboarding

# Password reset
# 1. /login → "Esqueci minha senha"
# 2. Inbox recebe link
# 3. Click → aterrissa em /perfil/seguranca com sessão ativa
```

Se algum passo falha, o Vercel logs em `[Auth Callback]` ou
`[Auth Confirm]` mostram a razão exata (exchangeCodeForSession /
verifyOtp error message).
