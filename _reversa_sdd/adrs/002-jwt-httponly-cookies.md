# ADR-002: JWT em Cookies HttpOnly (Não em localStorage)

> Status: Aceito
> Data: 2026-05-01
> Contexto: Introduzido no commit `94ca2f2` ("feat: creating auth logic and integration")

## Contexto e problema

Tokens de autenticação precisam ser transportados entre frontend (Next.js) e backend (Django). As duas alternativas canônicas são:

1. **Header `Authorization: Bearer <token>`** — simples, mas vulnerável a XSS.
2. **`localStorage` / `sessionStorage`** — persistente, mas acessível a JavaScript (XSS).
3. **Cookies HttpOnly** — inacessíveis a JS, enviados automaticamente pelo browser.

## Decisão

Emitir access e refresh tokens como **cookies HttpOnly** com `SameSite=Lax` e `Secure` em produção. O frontend consome via proxy (Route Handler) que injeta o cookie automaticamente.

### Configuração adotada

| Token | TTL | Path | HttpOnly | SameSite | Secure (prod) |
|-------|-----|------|----------|----------|---------------|
| `access_token` | 5 min | `/` | ✅ | `Lax` | ✅ |
| `refresh_token` | 24 h | `/api/auth/token/refresh/` | ✅ | `Lax` | ✅ |

🟢 Fonte: `backend/accounts/views.py:68-92, 121-152`; `backend/config/settings.py:198-216`.

### Por que `path` separado para o refresh?

Restringir o path do `refresh_token` minimiza o envio do cookie em requests desnecessários (defesa contra vazamento em sub-requests) e facilita revogação localizada se necessário.

## Consequências

### Positivas
- 🟢 **Inacessível a JavaScript** → XSS não rouba o token.
- 🟢 **Auto-refresh transparente** possível (o proxy detecta 401, chama refresh, retry).
- 🟢 **CSRF mitigado** por `SameSite=Lax` (cookie não enviado em POST cross-site).

### Negativas
- 🟡 **Vulnerável a CSRF** em alguns cenários (mitigado por `SameSite=Lax` e `CORS_ALLOWED_ORIGINS`).
- 🟡 **Necessita proxy no Next.js** porque o cookie é por host — chamadas cross-origin (frontend Next → backend Django em outro subdomínio) precisam de relay.

## Alternativas consideradas

1. **Header `Authorization: Bearer`**: rejeitada. Exporia o token ao JavaScript do frontend; além disso, complicaria o fluxo de refresh.
2. **`localStorage`**: rejeitada. XSS roubaria tokens.
3. **Sessão Django tradicional (cookie de sessão)**: rejeitada. Quebraria a arquitetura de frontend separado (Next.js) e complicaria o deploy.
