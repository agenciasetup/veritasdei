# Trava do Veritas Dei (domínio principal)

> **Status:** ativa desde maio/2026. O foco do produto é o **Veritas Educa**.
> O Veritas Dei full **não foi removido** — está apenas "dormindo" atrás de
> um redirecionador. Tudo aqui é reversível com uma variável de ambiente.

## O que a trava faz

Enquanto `LOCK_VERITAS_DEI` **não** for `false`, o middleware
(`src/lib/supabase/middleware.ts`) intercepta toda requisição no domínio
principal (`veritasdei.com.br`, `www.veritasdei.com.br`) e:

- **Páginas** → redireciona (307) pro mesmo path no subdomínio
  `educa.veritasdei.com.br`, preservando o caminho e a query string.
- **Rotas operacionais** → continuam funcionando normalmente no domínio
  principal, pra **não quebrar integrações externas**:
  - `/api/*` — webhooks de pagamento (Asaas, Stripe, Hubla, RevenueCat),
    crons e demais endpoints.
  - `/auth/*` — callbacks de OAuth e magic link.
  - `/checkout/*` — URLs de retorno dos provedores de pagamento.

Em desenvolvimento local o redirect aponta pra `educa.localhost:<porta>`
(o host `educa.` é o que ativa o produto `veritas-educa`).

## Por que não apagamos o código

O Veritas Dei full (comunidade, paróquias, hubs, etc.) será retomado no
futuro. Nenhuma página, componente ou rota foi removida — só existe a
camada de redirecionamento no middleware. Reabrir é trivial.

## Como reabrir o Veritas Dei full

1. Defina a variável de ambiente:

   ```
   LOCK_VERITAS_DEI=false
   ```

   (na Vercel: Project → Settings → Environment Variables; localmente:
   `.env`)

2. Faça um novo deploy / reinicie o dev server.

Pronto — o domínio principal volta a servir o app completo. O subdomínio
`educa.*` continua funcionando exatamente como antes, sem mudança.

## Gate de assinatura do Veritas Educa

Independente da trava acima, o subdomínio `educa.*` tem um **pedágio de
assinatura** no middleware: usuário logado **sem assinatura ativa** só
acessa `/educa/assine` e `/perfil` (preencher o perfil). Qualquer outra
rota é encaminhada pra `/educa/assine`. Ao assinar, tudo é liberado.

- A verificação usa o RPC `get_user_entitlement`.
- Em caso de erro transitório de banco, o gate **fail-open** (libera) —
  um soluço de DB não pode trancar quem já paga. O conteúdo premium ainda
  tem gates server-side próprios (`RequirePremium`).
- Admins passam pelo gate normalmente: o RPC já trata `fonte=admin_role`
  como assinatura ativa, e `/admin/*` está na allowlist por garantia.

## Arquivos envolvidos

| Arquivo | Papel |
|---|---|
| `src/lib/supabase/middleware.ts` | Trava do domínio principal + gate de assinatura do Educa |
| `src/lib/product/types.ts` | `productFromHostname()` — decide o produto pelo host |
| `src/components/educa/*` | Shell, nav e topbar do Veritas Educa |
| `.env.example` | Documenta `LOCK_VERITAS_DEI` |
