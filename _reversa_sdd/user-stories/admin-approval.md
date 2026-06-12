# User Story — Fluxo de Aprovação de Administrador

> Spec gerada pelo Redator em 2026-06-06
> `doc_level` = `completo`
> User story cobrindo o gate de aprovação: novo usuário → pending → admin aprova → vira approved.

**Escala de confiança:** 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## Personas

### 🛡️ Roberta (admin)
- Já existe na seed inicial (criada via Django `createsuperuser` ou seed automática)
- Tem `role="admin"`, `approval_status="approved"`, `is_staff=true`
- Pode listar todos os usuários, aprovar, mudar role
- Usa **Django admin** (`/admin/`) para essas operações (frontend sem UI de admin)

### 🧑‍💻 Pedro (novo usuário)
- Se registrou via `/register`
- Status inicial: `role="reader"`, `approval_status="pending"`
- Tenta logar → recebe 403
- Aguarda Roberta aprovar

### ✍️ Mauro (editor, pós-aprovação)
- Foi aprovado por Roberta
- Foi promovido de `reader` para `editor` via `PATCH /api/auth/users/{pk}/`
- Pode adicionar podcasts

### 👁️ Sofia (reader, pós-aprovação)
- Foi aprovada por Roberta
- Permanece como `reader` (não foi promovida)
- Pode logar, mas não adicionar podcasts

---

## Fluxo 1: Estado inicial do usuário (seed)

**Ator:** Sistema (seed).

### Cenário

```gherkin
Dado que o sistema é instalado pela primeira vez
Quando a seed é executada
Então o usuário admin é criado com:
  - email: "admin@podigger.app"
  - role: "admin"
  - approval_status: "approved"
  - is_staff: true
  - is_active: true
E Roberta pode logar imediatamente após a instalação
```

**Origem no legado:**
- `backend/accounts/models.py:User` (CustomUser com `role` e `approval_status`)
- Seed/migration inicial

---

## Fluxo 2: Registro de novo usuário → estado `pending`

**Ator:** Pedro (visitante anônimo).

**Pré-condição:** Pedro tem email válido e senha ≥ 8 chars.

### Cenário feliz

```gherkin
Dado que Pedro acessa /register
E preenche email "novo@podigger.app" e senha "minhasenha123"
E confirmou a senha igual
Quando clica em "Criar conta"
Então POST /api/auth/register/ é chamado
E cria User com:
  - email: "novo@podigger.app"
  - role: "reader" (default)
  - approval_status: "pending" (default)
  - is_active: true
  - is_staff: false
E retorna 201 { email: "novo@podigger.app" }
E Pedro vê "Conta criada com sucesso! Aguarde aprovação do administrador"
E NÃO há redirect (Pedro precisa esperar)
```

**Origem no legado:**
- `backend/accounts/views.py:182-197` (`RegisterView`)
- `backend/accounts/serializers.py:53-65` (`RegisterSerializer`)
- `backend/accounts/models.py:User` (defaults)
- `frontend/src/app/register/page.tsx`

### Estados do User após registro

| Campo | Valor |
|-------|-------|
| `id` | auto-increment |
| `email` | "novo@podigger.app" |
| `password` | hash bcrypt |
| `role` | "reader" (default) |
| `approval_status` | "pending" (default) |
| `is_active` | true |
| `is_staff` | false |
| `created_at` | now() |

---

## Fluxo 3: Tentativa de login com conta `pending`

**Ator:** Pedro, conta recém-registrada.

**Pré-condição:** Pedro acabou de se registrar, status=pending.

### Cenário

```gherkin
Dado que Pedro está com conta pending
E acessa /login
E preenche email "novo@podigger.app" e senha "minhasenha123"
Quando clica em "Entrar"
Então POST /api/auth/token/ é chamado
E o backend identifica approval_status="pending"
E retorna 403 { detail: "Sua conta aguarda aprovação" }
E a página /login exibe "Aguarde aprovação do administrador" (pendingMessage)
E NÃO há redirect
E Pedro fica na página de login
```

**Origem no legado:**
- `backend/accounts/views.py:47-96` (`TokenObtainCookieView`, lógica de pending)
- `frontend/src/app/login/page.tsx` (tratamento de 403)

---

## Fluxo 4: Roberta (admin) aprova Pedro

**Ator:** Roberta, admin.

**Pré-condição:** Roberta está logada com role=admin. Pedro tem conta pending.

### Cenário via Django admin (gap de UI)

```gherkin
Dado que Roberta acessa /admin (Django admin)
E faz login com suas credenciais de admin
Quando acessa /admin/accounts/user/ (lista de usuários)
Então vê todos os usuários, incluindo Pedro com approval_status=pending
E clica em Pedro
E na página de edição, muda approval_status de "pending" para "approved"
E salva
Então Pedro agora tem approval_status="approved"
# OU usa o endpoint custom:

Dado que Roberta tem acesso ao endpoint custom
Quando POST /api/auth/users/{pk}/approve/ é chamado
Então retorna 200 com User atualizado:
  - approval_status: "approved"
  - outros campos inalterados
E Pedro agora pode logar

# Gap R-USER-08:
# NÃO há registro de quem/quando aprovou
# Sem audit log
```

**Origem no legado:**
- `backend/accounts/views.py:223-236` (`UserApproveView`)
- `backend/accounts/serializers.py:UserSerializer`
- `backend/accounts/permissions.py:7-11` (`IsAdminRole`)

### Cenário de erro (não-admin tentando aprovar)

```gherkin
Dado que Mauro (editor) tenta aprovar um usuário
Quando POST /api/auth/users/{pk}/approve/ é chamado
Então retorna 403 { detail: "You do not have permission to perform this action." }
E o status de Pedro NÃO é alterado
# Apenas admin pode aprovar
```

---

## Fluxo 5: Pedro (agora approved) loga com sucesso

**Ator:** Pedro, conta recém-aprovada por Roberta.

**Pré-condição:** Roberta aprovou Pedro. Status agora é "approved".

### Cenário feliz

```gherkin
Dado que Pedro tem approval_status="approved" e role="reader"
E acessa /login
E preenche email e senha corretos
Quando clica em "Entrar"
Então POST /api/auth/token/ é chamado
E o backend identifica approval_status="approved"
E retorna 200 { role: "reader", email: "novo@podigger.app" }
E Set-Cookie emite access_token e refresh_token
E a página exibe "Login realizado com sucesso"
E AuthContext.login("reader", "novo@podigger.app")
E router.push('/') navega para home
E Pedro vê o Navbar com "Logout" (autenticado)
```

**Origem no legado:**
- `backend/accounts/views.py:47-96` (`TokenObtainCookieView`)
- `frontend/src/app/login/page.tsx`
- `frontend/src/contexts/AuthContext.tsx`

---

## Fluxo 6: Roberta promove Pedro para editor

**Ator:** Roberta, admin.

**Pré-condição:** Pedro tem approval_status="approved", role="reader".

### Cenário

```gherkin
Dado que Pedro está aprovado e autenticado como reader
E Roberta quer promovê-lo para editor
Quando PATCH /api/auth/users/{pk}/ com body { role: "editor" }
Então retorna 200 com User atualizado:
  - id: {pk}
  - role: "editor" (alterado)
  - approval_status: "approved" (inalterado)
E Pedro agora tem permissão para adicionar podcasts
# Mas a sessão ativa de Pedro ainda tem o role antigo no AuthContext
# Pedro precisa re-loggar para que o novo role seja refletido
# OU o AuthContext precisa de mecanismo de sync

# Gap conhecido: AuthContext não sincroniza com backend
# Após role change, Pedro vê UI antiga até re-loggar
```

**Origem no legado:**
- `backend/accounts/views.py:254-275` (`UserRoleUpdateView`)
- `backend/accounts/permissions.py:7-11` (`IsAdminRole`)

---

## Fluxo 7: Pedro (agora editor) adiciona seu primeiro podcast

**Ator:** Pedro, recém-promovido a editor.

**Pré-condição:** Pedro re-loggou após ser promovido. AuthContext.login("editor", "novo@podigger.app") foi chamado.

### Cenário

```gherkin
Dado que Pedro está autenticado com role=editor
E o cookie access_token tem claim role=editor
Quando Pedro acessa GET /add-podcast
Então o Edge Middleware passa adiante (cookie presente)
E AddPodcastPage monta
E useAuth() retorna user.role="editor"
E role check: editor → renderiza o form
E Pedro vê o link "+ Add Podcast" no Navbar (estava oculto antes)
E preenche "name" e "feed"
E clica em "Add Podcast"
Então addPodcast(name, feed) é chamado
E POST /api/podcasts/ retorna 201
E Celery task é agendada
```

---

## Fluxo 8: Roberta rebaixa Mauro (editor → reader)

**Ator:** Roberta, admin.

**Pré-condição:** Mauro tem role="editor".

### Cenário

```gherkin
Dado que Mauro está ativo como editor
Quando PATCH /api/auth/users/{pk}/ com body { role: "reader" }
Então retorna 200 com User atualizado
E Mauro perde permissão de adicionar podcasts
# Mas a sessão ativa de Mauro ainda tem role=editor no AuthContext
# Mauro só descobre quando tenta adicionar podcast e o backend retorna 403
# Ou quando o access_token expira (5min) e ele re-logga

# Possível mitigação futura: invalidar tokens do Mauro ao rebaixar
# (similar a logout forçado)
```

---

## Fluxo 9: Roberta desativa usuário (is_active=false)

**Ator:** Roberta, admin.

### Cenário

```gherkin
Dado que Roberta quer desativar Pedro (sem deletar)
Quando acessa Django admin /admin/accounts/user/{pk}/change/
E marca is_active=false
E salva
Então Pedro não consegue mais logar (authenticate falha)
E mesmo se tentar POST /api/auth/token/, retorna 401 "No active account found"
# Ou se usar o endpoint, retorna erro similar
# Tokens ativos do Pedro continuam válidos até exp (5min access, 24h refresh)
```

**Origem no legado:**
- `backend/accounts/models.py:User.is_active` (default=True)
- Django default `ModelBackend.authenticate()` verifica `is_active`

---

## Máquina de estados do User

```
                   ┌─────────────────┐
                   │  (não existe)   │
                   └────────┬────────┘
                            │
              POST /api/auth/register/
                            │
                            ↓
                  ┌─────────────────────┐
            ┌────→│ approval_status=    │
            │     │ "pending"           │
            │     │ role="reader"       │
            │     │ is_active=true      │
            │     │ is_staff=false      │
            │     └─────────┬───────────┘
            │               │
            │  POST /api/auth/users/{pk}/approve/
            │  (admin only)
            │               │
            │               ↓
            │     ┌─────────────────────┐
            │     │ approval_status=    │
            │     │ "approved"          │
            │     │ role="reader"       │
            │     └─────────┬───────────┘
            │               │
            │  PATCH /api/auth/users/{pk}/
            │  { role: "editor" }
            │               │
            │               ↓
            │     ┌─────────────────────┐
            │     │ approval_status=    │
            │     │ "approved"          │
            │     │ role="editor"|      │
            │     │ "admin"             │
            │     └─────────┬───────────┘
            │               │
            │  PATCH { role: "reader" }
            │               │
            │               ↓
            │     ┌─────────────────────┐
            │     │ approval_status=    │
            │     │ "approved"          │
            │     │ role="reader"       │
            │     └─────────┬───────────┘
            │               │
            │  is_active=false (Django admin)
            │               │
            │               ↓
            │     ┌─────────────────────┐
            └─────┤ is_active=false     │
                  │ (não pode logar)    │
                  └─────────────────────┘

Nota: NÃO há estado "rejected" — admin ou aprova ou ignora.
Não há re-pending (não dá para voltar de approved para pending).
```

**Origem no legado:**
- `backend/accounts/models.py:User` (campos e choices)
- `backend/accounts/state-machines.md` (R-USER-01..08)

---

## Diagrama de sequência: registro → aprovação → primeiro uso

```
[Visitante]      [Frontend]      [Backend Django]    [DB]        [Admin]
     │                │                  │              │            │
     │ POST /register │                  │              │            │
     ├───────────────→│ POST /api/auth/register/         │            │
     │                ├─────────────────→│ INSERT user  │            │
     │                │                  │ (pending)    │            │
     │                │                  ├─────────────→│            │
     │                │                  │←────────────┤            │
     │                │←──── 201 ────────┤              │            │
     │←─ "Aguarde ────┤                  │              │            │
     │  aprovação"    │                  │              │            │
     │                │                  │              │            │
     │ POST /login    │                  │              │            │
     ├───────────────→│ POST /api/auth/token/            │            │
     │                ├─────────────────→│ SELECT user  │            │
     │                │                  │ (pending)    │            │
     │                │                  ├─────────────→│            │
     │                │                  │←────────────┤            │
     │                │←── 403 ──────────┤              │            │
     │←─ "Aguarde ────┤                  │              │            │
     │  aprovação"    │                  │              │            │
     │                │                  │              │            │
     │                │                  │              │←─── Lista users
     │                │                  │              │←─── Aprova Pedro
     │                │                  │ UPDATE       │            │
     │                │                  │ (approved)   │            │
     │                │                  ├─────────────→│            │
     │                │                  │              │            │
     │ POST /login    │                  │              │            │
     │ (após aprov.)  │                  │              │            │
     ├───────────────→│ POST /api/auth/token/            │            │
     │                ├─────────────────→│ SELECT user  │            │
     │                │                  │ (approved)   │            │
     │                │                  ├─────────────→│            │
     │                │                  │←────────────┤            │
     │                │←── 200 + ────────┤              │            │
     │                │   Set-Cookie     │              │            │
     │←─ home ────────┤                  │              │            │
     │  (logged in)   │                  │              │            │
```

---

## Rastreabilidade

| Fluxo | Backend | Specs |
|-------|---------|-------|
| Registro (→ pending) | `backend/accounts/views.py:182-197` | `accounts/contracts.md` (RF-AUTH-05) |
| Login (pending → 403) | `backend/accounts/views.py:47-96` | `accounts/contracts.md` (RF-AUTH-01, error 403) |
| Aprovar (pending → approved) | `backend/accounts/views.py:223-236` | `accounts/contracts.md` (RF-AUTH-08) |
| Listar users | `backend/accounts/views.py:200-209` | `accounts/contracts.md` (RF-AUTH-07) |
| Mudar role | `backend/accounts/views.py:254-275` | `accounts/contracts.md` (RF-AUTH-09) |
| Desativar | Django admin (default) | `accounts/models.py:User.is_active` |
| State machine | `backend/accounts/state-machines.md` | `accounts/requirements.md` (R-USER-01..08) |

---

## Lacunas conhecidas (🔴)

- **R-USER-08 (🔴):** Aprovação não registra `approved_by` nem `approved_at`. Sem audit log.
- **Sem UI de admin no frontend:** Todas as operações admin (list, approve, change role) usam Django admin (`/admin/`). Frontend não tem página `/admin/users/`.
- **Sem endpoint `GET /api/auth/users/{id}/`:** Não dá para buscar usuário único (só lista via `GET /api/auth/users/`).
- **Sem `GET /api/auth/me/`:** Frontend perde `user` no reload (cookie HttpOnly não é lido por JS).
- **AuthContext não sincroniza com role change:** Após `PATCH /role/`, a sessão ativa mantém o role antigo até re-loggar.
- **Sem estado "rejected":** Admin só pode aprovar ou ignorar. Não há como rejeitar formalmente.
- **Sem transição pending → pending:** Não dá para voltar de approved para pending.
- **Sem invalidation forçada:** Rebaixar role não invalida tokens ativos do usuário.
- **Sem limite de tentativas de login diferenciadas por pending:** Pending user recebe 403 após authenticate bem-sucedido, mas a contagem de throttle (5/min) é gasta igualmente.
- **Sem notificação de aprovação:** Pedro não recebe email quando Roberta aprova. Precisa tentar logar de novo para descobrir.

---

## Decisões validadas pelo Q&A 2026-06-05

| ID | Decisão | Origem |
|----|---------|--------|
| AI-6 | Admin pode alterar o próprio role (sem proteção `pk != request.user.pk`) | Decisão consciente, registrada |
| R-USER-08 | Aprovação sem audit log | Gap conhecido, mitigação futura |
| AI-5 | Logout não chama `POST /api/auth/token/blacklist/` | Gap conhecido, mitigação via TTL curto |
