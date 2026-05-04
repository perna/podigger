# User Story — Autenticação e Gestão de Usuários

> Spec gerada pelo Redator em 2026-06-06
> `doc_level` = `completo`
> User story cobrindo o fluxo completo de auth: registro → aprovação → login → logout → refresh.

**Escala de confiança:** 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## Personas

### 👤 Carla (visitante anônimo)
- Quer descobrir podcasts e ouvir episódios
- Sem conta criada
- Pode navegar na home, ver listagens, fazer buscas (todas as rotas `/api/episodes/`, `/api/podcasts/`, `/api/popular-terms/` são públicas)
- **Não pode** adicionar podcasts (precisa ser `editor` ou `admin`)

### 🧑‍💻 Pedro (novo usuário registrado)
- Se registrou via `/register` → status `pending`
- Tenta logar → recebe 403 "Sua conta aguarda aprovação"
- Aguarda admin aprovar
- Após aprovação → consegue logar com sucesso

### 🛡️ Roberta (admin)
- Já aprovada desde o início (seed)
- Pode listar todos os usuários (`GET /api/auth/users/`)
- Pode aprovar novos usuários (`POST /api/auth/users/{pk}/approve/`)
- Pode promover/demover roles (`PATCH /api/auth/users/{pk}/`)
- Pode adicionar podcasts, ver todos os endpoints administrativos

### ✍️ Mauro (editor)
- Aprovado por admin
- Pode adicionar podcasts e gerenciar episódios
- **Não pode** aprovar usuários ou mudar roles (apenas admin)

### 👁️ Sofia (reader)
- Aprovado por admin
- Pode logar e usar o app
- Pode personalizar tema, ver histórico
- **Não pode** adicionar podcasts (apenas `editor`/`admin`)

---

## Fluxo 1: Registro de nova conta (Pedro)

**Ator:** Carla visita o site pela primeira vez, quer criar conta.

**Pré-condição:** Carla tem email válido e uma senha com ≥ 8 caracteres.

### Cenário feliz (Gherkin)

```gherkin
Dado que Carla está na página /register
E preencheu email "novo@podigger.app" e senha "minhasenha123"
E confirmou a senha igual
Quando clica em "Criar conta"
Então POST /api/auth/register/ é chamado
E retorna 201 com body { email: "novo@podigger.app" }
E a página exibe "Conta criada com sucesso! Aguarde aprovação do administrador"
E o form é escondido
E NÃO há redirect (Pedro precisa esperar aprovação)
```

**Origem no legado:**
- `frontend/src/app/register/page.tsx` (form + validação client-side)
- `backend/accounts/views.py:182-197` (`RegisterView`)
- `backend/accounts/serializers.py:53-65` (`RegisterSerializer`)

### Cenários de erro

```gherkin
Dado que Carla preencheu email "invalido" (sem @)
Quando clica em "Criar conta"
Então a validação client-side bloqueia
E exibe "Email inválido" sem chamar API

Dado que Carla preencheu senhas diferentes nos dois campos
Quando clica em "Criar conta"
Então a validação client-side bloqueia
E exibe "As senhas não coincidem" sem chamar API

Dado que o email "novo@podigger.app" já está cadastrado
Quando POST /api/auth/register/ é chamado
Então retorna 400 com body { detail: "Email já cadastrado" }
E a página exibe "Este email já está cadastrado"

Dado que Carla tenta registrar com senha "curta" (< 8 chars)
Quando POST /api/auth/register/ é chamado
Então retorna 400 com body { password: ["Ensure this field has at least 8 characters."] }
E a página exibe "A senha deve ter pelo menos 8 caracteres"

Dado que Carla tenta registrar 4 vezes em 1 minuto
Quando POST /api/auth/register/ é chamado pela 4ª vez
Então retorna 429 com body { detail: "Request was throttled. Expected available in N seconds." }
E a página exibe "Muitas tentativas. Tente novamente em X segundos"
```

---

## Fluxo 2: Login (Pedro, após aprovação)

**Ator:** Pedro, conta já aprovada por admin.

**Pré-condição:** Pedro tem conta `pending` que foi aprovada.

### Cenário feliz

```gherkin
Dado que Pedro está na página /login
E preencheu email "novo@podigger.app" e senha "minhasenha123"
Quando clica em "Entrar"
Então POST /api/auth/login (route handler) é chamado
E repassa para POST /api/auth/token/ no backend
E retorna 200 com body { role: "reader", email: "novo@podigger.app" }
E Set-Cookie emite access_token (path=/, max-age=300) e refresh_token (path=/api/auth/token/refresh/, max-age=86400)
E AuthContext.login("reader", "novo@podigger.app") é chamado
E router.push('/') ou router.push(next) é executado
E a home é renderizada com o user autenticado
```

**Origem no legado:**
- `frontend/src/app/login/page.tsx` (form)
- `frontend/src/app/api/auth/login/route.ts` (route handler com forward Set-Cookie)
- `backend/accounts/views.py:47-96` (`TokenObtainCookieView`)
- `frontend/src/contexts/AuthContext.tsx:28-30` (`login`)

### Cenários de erro

```gherkin
Dado que Pedro digitou email "novo@podigger.app" e senha "errada"
Quando clica em "Entrar"
Então POST /api/auth/token/ retorna 401 { detail: "Email ou senha inválidos" }
E a página exibe "Email ou senha inválidos" (sem hint de campo)

Dado que Pedro digitou email "novo@podigger.app" e senha "minhasenha123" mas sua conta está pending
Quando clica em "Entrar"
Então POST /api/auth/token/ retorna 403 { detail: "Sua conta aguarda aprovação" }
E a página exibe "Aguarde aprovação do administrador"
E NÃO há redirect (Pedro fica em /login)

Dado que o backend Django está fora do ar
Quando clica em "Entrar"
Então o route handler retorna 503 { detail: "Serviço indisponível, tente novamente em alguns instantes." }
E a página exibe mensagem de erro genérica

Dado que Pedro tentou logar 6 vezes em 1 minuto
Quando clica em "Entrar" pela 6ª vez
Então retorna 429 { detail: "Request was throttled..." }
E a página exibe "Muitas tentativas. Tente novamente em X segundos"
```

---

## Fluxo 3: Aprovação de novo usuário (Roberta/admin)

**Ator:** Roberta, admin. Pedro é o usuário a aprovar.

**Pré-condição:** Pedro registrou conta (status `pending`) e está aguardando.

### Cenário feliz

```gherkin
Dado que Roberta está em /admin (rota protegida)
E tem cookie access_token com role=admin
Quando acessa a lista de usuários
Então GET /api/auth/users/ retorna 200 com array de usuários
E os usuários com approval_status=pending são destacados
E Roberta clica em "Aprovar" para Pedro
Então POST /api/auth/users/{pk}/approve/ é chamado
E retorna 200 com objeto User atualizado (approval_status=approved)
E Pedro agora pode logar
```

**Origem no legado:**
- `backend/accounts/views.py:200-209` (`UserListView`)
- `backend/accounts/views.py:223-236` (`UserApproveView`)
- `backend/accounts/permissions.py:7-11` (`IsAdminRole`)

### Cenários de erro

```gherkin
Dado que Mauro (editor, não admin) tenta acessar /admin/users
Quando GET /api/auth/users/ é chamado
Então retorna 403 { detail: "You do not have permission to perform this action." }
E a UI mostra "Acesso restrito a administradores"

Dado que Roberta tenta aprovar um usuário inexistente (pk=99999)
Quando POST /api/auth/users/99999/approve/ é chamado
Então retorna 404 { detail: "Not found." }
E a UI mostra "Usuário não encontrado"

# Gap conhecido R-USER-08:
Dado que Roberta aprova Pedro
Quando POST /api/auth/users/{pk}/approve/ retorna 200
Então approval_status=approved, mas NÃO há registro de quem/quando aprovou
# Mitigação futura: adicionar campo `approved_by`, `approved_at` ao model User
```

---

## Fluxo 4: Mudança de role (Roberta/admin)

**Ator:** Roberta, admin.

### Cenário feliz

```gherkin
Dado que Roberta quer promover Mauro de editor para admin
Quando PATCH /api/auth/users/{pk}/ com body { role: "admin" }
Então retorna 200 com User atualizado
E Mauro agora tem acesso a endpoints administrativos

# Decisão consciente (Q&A 2026-06-05, AI-6):
Dado que Roberta quer mudar o próprio role de admin para reader
Quando PATCH /api/auth/users/{own_pk}/ com body { role: "reader" }
Então a API aceita a mudança (sem proteção pk != request.user.pk)
E Roberta perde acesso admin imediatamente
# Mitigação: logout forçado ou confirmação extra
```

### Cenário de erro

```gherkin
Dado que Roberta tenta setar role para "superuser" (valor inválido)
Quando PATCH /api/auth/users/{pk}/ com body { role: "superuser" }
Então retorna 400 { detail: "papel inválido" }
E o role do usuário não é alterado

# Gap conhecido:
Dado que Roberta altera role de Mauro
Quando PATCH retorna 200
Então NÃO há registro de quem/quando alterou
# Mitigação futura: audit log
```

---

## Fluxo 5: Logout (qualquer usuário autenticado)

**Ator:** Pedro, Mauro, Roberta ou Sofia (qualquer role autenticado).

### Cenário feliz

```gherkin
Dado que Pedro está autenticado (qualquer página)
Quando clica em "Sair" no Navbar
Então fetch('/api/auth/logout', POST) é chamado
E o route handler emite Set-Cookie access_token=; Max-Age=0 e refresh_token=; Max-Age=0
E AuthContext.logout() é chamado (user=null)
E router.push('/') navega para home
E a UI mostra "Login" no lugar de "Logout"

# Gap conhecido AI-5:
# O route handler NÃO chama POST /api/auth/token/blacklist/ no backend
# Os tokens JWT permanecem válidos até exp (5min access, 24h refresh)
# Mitigação: TTL curto do access token + exp do refresh em 24h
```

### Cenário de erro

```gherkin
Dado que o backend está fora do ar
Quando clica em "Sair"
Então fetch falha silenciosamente (try/catch)
E AuthContext.logout() ainda é chamado
E router.push('/') navega para home
# UX: usuário vê logout funcionar mesmo se backend estiver down
```

---

## Fluxo 6: Auto-refresh transparente (qualquer usuário autenticado)

**Ator:** Pedro com sessão ativa.

### Cenário feliz

```gherkin
Dado que Pedro está autenticado com access_token próximo de expirar (4:30 de 5min)
E faz uma chamada via /api/proxy/podcasts/
Quando o backend retorna 401
Então o proxy tenta POST /api/auth/token/refresh/ com refresh_token cookie
E em sucesso: extrai novo access_token via regex e re-envia a request
E o usuário recebe 200 do backend sem perceber o refresh
```

**Origem no legado:**
- `frontend/src/app/api/proxy/[...path]/route.ts:185-206` (lógica de auto-refresh)
- `backend/accounts/views.py:118-156` (`TokenRefreshCookieView`)

### Cenário de erro

```gherkin
Dado que Pedro está autenticado com refresh_token expirado (24h+)
E faz uma chamada via /api/proxy/podcasts/
Quando o backend retorna 401
Então o proxy tenta POST /api/auth/token/refresh/
E retorna 401 (refresh inválido/expirado)
E o proxy redireciona 302 para /auth/unauthorized?next=...
E emite Set-Cookie Max-Age=0 para limpar access_token e refresh_token
E Pedro é forçado a logar de novo
```

---

## Fluxo 7: Proteção de rotas autenticadas (middleware Edge)

**Ator:** Carla (anônimo) tentando acessar rota protegida.

### Cenário

```gherkin
Dado que Carla é anônima (sem cookie access_token)
E tenta acessar GET /add-podcast
Quando o middleware Edge avalia a request
Então cookie access_token está ausente
E retorna 302 para /auth/unauthorized?next=%2Fadd-podcast
E o browser segue o redirect
E a página /auth/unauthorized exibe "Acesso restrito" + botão "Fazer login" apontando para /login?next=%2Fadd-podcast

# Defesa em camadas (2 níveis):
Dado que Carla conseguiu passar pelo middleware (cookie forjado)
E tenta acessar GET /add-podcast
Quando a página AddPodcastPage renderiza
Então useAuth() retorna user=null (ou role inválido)
E a página renderiza "Acesso Negado" inline (sem mostrar form)
```

**Origem no legado:**
- `frontend/src/middleware.ts:13-24` (Edge Middleware)
- `frontend/src/app/add-podcast/page.tsx` (page guard)

---

## Diagrama do fluxo completo

```
[Visitante Anônimo]
        │
        ├──→ /register ──POST /api/auth/register/──→ [pending]
        │                                          │
        │                                          ↓
        │                                   [admin aprova]
        │                                          │
        │                                          ↓
        │                                     [approved]
        │                                          │
        │   /login                                │
        ├──────POST /api/auth/token/──────────────┤
        │         │                                │
        │    200 + Set-Cookie                      │
        │    (access + refresh)                    │
        │         │                                │
        │    AuthContext.login()                   │
        │         │                                │
        │         ↓                                ↓
        │   [Autenticado: reader/editor/admin]     │
        │         │                                │
        │         ├──→ /add-podcast ────POST /api/podcasts/ (se editor/admin)
        │         │                            │
        │         │                       [pending add]
        │         │                            │
        │         │                       (Celery task atualiza)
        │         │                            │
        │         │                       [episódios aparecem]
        │         │
        │         ├──→ /api/proxy/podcasts/ (auto-refresh transparente)
        │         │       │
        │         │       ├──→ 401? refresh automático
        │         │       │      │
        │         │       │      ├──→ success: retry com novo token
        │         │       │      └──→ fail: redirect /auth/unauthorized
        │         │
        │         └──→ /api/auth/logout (limpa cookies, NÃO chama backend)
        │
        └──→ [Logout local, tokens ainda válidos até exp]
```

---

## Matriz de permissões por fluxo

| Fluxo | Anônimo | Reader | Editor | Admin |
|-------|---------|--------|--------|-------|
| `POST /api/auth/register/` | ✅ | ✅ | ✅ | ✅ |
| `POST /api/auth/token/` (login) | ✅ | ✅ | ✅ | ✅ |
| `POST /api/auth/token/refresh/` | ✅ (com cookie) | ✅ | ✅ | ✅ |
| `GET /api/auth/users/` (list) | ❌ 401 | ❌ 403 | ❌ 403 | ✅ |
| `POST /api/auth/users/{pk}/approve/` | ❌ 401 | ❌ 403 | ❌ 403 | ✅ |
| `PATCH /api/auth/users/{pk}/` (role) | ❌ 401 | ❌ 403 | ❌ 403 | ✅ |
| `GET /api/podcasts/` | ✅ | ✅ | ✅ | ✅ |
| `POST /api/podcasts/` | ❌ 401 | ❌ 403 | ✅ | ✅ |
| `PATCH/DELETE /api/podcasts/{id}/` | ❌ 401 | ❌ 403 | ✅ | ✅ |
| `GET /api/episodes/` | ✅ | ✅ | ✅ | ✅ |
| `POST /api/episodes/` | ❌ 401 | ❌ 403 | ✅ | ✅ |
| `GET /api/popular-terms/` | ✅ | ✅ | ✅ | ✅ |
| `GET /api/topic-suggestions/` | ✅ | ✅ | ✅ | ✅ |
| `POST /api/topic-suggestions/` | ❌ 401 | ❌ 403 | ✅ | ✅ |
| `GET /health/` | ✅ | ✅ | ✅ | ✅ |

---

## Rastreabilidade

| Fluxo | Backend | Frontend | Specs |
|-------|---------|----------|-------|
| Registro | `backend/accounts/views.py:182-197` | `frontend/src/app/register/page.tsx` | `accounts/contracts.md` (RF-AUTH-05) |
| Login | `backend/accounts/views.py:47-96` | `frontend/src/app/login/page.tsx` + `api/auth/login/route.ts` | `accounts/contracts.md` (RF-AUTH-01) |
| Refresh | `backend/accounts/views.py:118-156` | `frontend/src/app/api/auth/refresh/route.ts` | `accounts/contracts.md` (RF-AUTH-02) |
| Logout | — (frontend-only) | `frontend/src/app/api/auth/logout/route.ts` | `frontend-pages/contracts.md` (RF-RH-06) |
| List users | `backend/accounts/views.py:200-209` | (admin page — gap) | `accounts/contracts.md` (RF-AUTH-07) |
| Approve | `backend/accounts/views.py:223-236` | (admin page — gap) | `accounts/contracts.md` (RF-AUTH-08) |
| Update role | `backend/accounts/views.py:254-275` | (admin page — gap) | `accounts/contracts.md` (RF-AUTH-09) |
| Middleware | — | `frontend/src/middleware.ts` | `frontend-pages/contracts.md` (RF-MW-01..03) |
| Auto-refresh | — | `frontend/src/app/api/proxy/[...path]/route.ts:185-206` | `frontend-pages/contracts.md` (RF-RH-09) |

> ⚠️ **Gap:** Não há UI de admin para listar/aprovar usuários ou mudar roles. Endpoints existem no backend mas o frontend não tem página. Decisão consciente de manter admin via Django admin (`/admin/`) por enquanto.

---

## Lacunas conhecidas (🔴)

- **R-USER-08:** Aprovação de usuário não registra quem/quando. Mitigação: adicionar `approved_by`, `approved_at` ao model User.
- **AI-5:** Logout não chama `POST /api/auth/token/blacklist/`. JWTs permanecem válidos até `exp`. Mitigação: TTL curto do access token (5 min).
- **AI-6:** Admin pode alterar o próprio role (sem proteção `pk != request.user.pk`). Decisão consciente.
- **Sem UI admin:** Endpoints `GET /api/auth/users/`, `POST /approve/`, `PATCH /role/` existem mas não têm frontend. Admin usa Django admin.
- **Sem `GET /api/auth/me/`:** Frontend perde `user` no reload (cookie HttpOnly, JS não lê).
- **Sem `GET /api/auth/users/{id}/`:** Não dá para buscar usuário único (só lista).
- **Resposta de login sem `approval_status`:** Frontend infere pela presença de role.
