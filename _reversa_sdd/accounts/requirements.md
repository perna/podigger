# accounts

> Spec gerada pelo Redator em 2026-06-05
> `doc_level` = `completo`
> Unit: app Django `accounts/` (autenticação, registro, usuários, papéis, permissões)
> Granularidade: `module`

**Escala de confiança:** 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## Visão Geral

O app `accounts` é o módulo de identidade do podigger. É responsável por autenticar usuários via JWT (armazenado em cookies HttpOnly), registrar novas contas que aguardam aprovação administrativa, listar e aprovar usuários, e gerenciar papéis (roles) no sistema. Implementa o modelo RBAC de 3 níveis (admin, editor, reader) com gate de aprovação ortogonal ao papel (ADR-008). É o ponto de entrada para todas as chamadas autenticadas na API.

## Responsabilidades

- Autenticar usuários por email+senha e emitir par de tokens JWT (access + refresh) em cookies HttpOnly.
- Renovar access_token a partir de refresh_token sem reautenticar.
- Registrar novos usuários com `approval_status="pending"` e `role="reader"` por padrão.
- Bloquear o login de usuários com `approval_status="pending"` (R-USER-04).
- Listar usuários (somente admin).
- Aprovar usuários pendentes, alterando `approval_status` para `approved` (somente admin).
- Atualizar `role` de um usuário (somente admin).
- Aplicar throttling em login (5/min) e registro (3/min) por IP anônimo.
- Expor permissões DRF: `IsAdminRole` e `IsEditorOrAdmin`.

## Regras de Negócio

- 🟢 **R-USER-01** — Email é obrigatório e único. `UserManager.create_user` lança `ValueError` se vazio.
- 🟢 **R-USER-02** — Novos usuários nascem `pending` (aprovação) e `reader` (papel mínimo).
- 🟢 **R-USER-03** — Senha mínima de 8 caracteres no registro.
- 🟢 **R-USER-04** — Usuário `pending` não consegue logar (HTTP 403 com `PermissionDenied`).
- 🟢 **R-USER-05** — Apenas admin pode listar/aprovar/mudar papel (RBAC).
- 🟢 **R-USER-06** — Editor e admin podem escrever conteúdo de domínio (podcasts, etc.).
- 🟢 **R-USER-07** — Mudança de papel aceita apenas `admin`, `editor`, `reader`.
- 🔴 **R-USER-08** — Aprovação não registra auditoria (gap conhecido, ver lacunas em `domain.md`).
- 🟡 **R-USER-09** — `UserRoleUpdateView` não impede admin de se auto-promover/rebaixar (decisão consciente: AI-6).
- 🟢 **R-USER-10** — Rate limit: login 5/min, register 3/min (anon).
- 🟢 **I-1** — `User.email` único no banco (constraint UNIQUE).
- 🟡 **I-7** — `User.role ∈ {admin, editor, reader}` validado em runtime, sem `db.CheckConstraint`.
- 🟡 **I-8** — `User.approval_status ∈ {pending, approved}` validado em runtime, sem `db.CheckConstraint`.

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Login com email e senha, retornando cookies HttpOnly (`access_token`, `refresh_token`) e body `{role, email}` | Must | `POST /api/auth/token/` com credenciais válidas de usuário `approved` retorna 200 + Set-Cookie. Ver `contracts.md`. |
| RF-02 | Bloqueio de login para conta com `approval_status="pending"` | Must | `POST /api/auth/token/` para usuário pending retorna 403 com mensagem PT-BR. |
| RF-03 | Renovação de access_token a partir de refresh_token | Must | `POST /api/auth/token/refresh/` com cookie `refresh_token` válido retorna 200 + novo cookie `access_token`. |
| RF-04 | Registro de nova conta com `approval_status="pending"` e `role="reader"` | Must | `POST /api/auth/register/` com email+senha (≥8 chars) retorna 201. Conta criada é inaccessible para login. |
| RF-05 | Validação de unicidade de email no registro | Must | Registro com email existente retorna 400 com mensagem PT-BR. |
| RF-06 | Validação de tamanho mínimo de senha | Must | Registro com senha < 8 chars retorna 400 com erro de validação. |
| RF-07 | Listagem de usuários para admin | Must | `GET /api/auth/users/` com admin retorna 200 com lista ordenada por `created_at`. Não-admin retorna 403. |
| RF-08 | Aprovação de usuário pendente | Must | `POST /api/auth/users/{id}/approve/` por admin retorna 200 com `UserSerializer`. Não-admin retorna 403. |
| RF-09 | Atualização de role de um usuário | Must | `PATCH /api/auth/users/{id}/` com body `{role: "admin"\|"editor"\|"reader"}` por admin retorna 200. Role inválido retorna 400. |
| RF-10 | Throttling de login: 5 req/min por IP anônimo | Must | 6ª tentativa em 1 minuto retorna 429. |
| RF-11 | Throttling de registro: 3 req/min por IP anônimo | Should | 4ª tentativa em 1 minuto retorna 429. |
| RF-12 | Login com credenciais inválidas retorna 401 | Must | Email inexistente ou senha errada retorna 401 com mensagem PT-BR. |
| RF-13 | Logout limpa cookies localmente | Should | `POST /api/auth/logout/` (frontend route) limpa `access_token` e `refresh_token` com `Max-Age=0`. |
| RF-14 | Custom User com email como username (sem campo `username`) | Must | `User.USERNAME_FIELD = "email"`. `User.username` não existe. |
| RF-15 | Cookie `access_token` com path `/`; `refresh_token` com path `/api/auth/token/refresh/` | Must | `Set-Cookie` no login define os dois cookies com paths distintos. |
| RF-16 | `CookieJWTAuthentication` lê token do cookie (não do header `Authorization`) | Must | Endpoint autenticado recebe `request.user` quando cookie presente. |
| RF-17 | `User` herda de `AbstractBaseUser` e `PermissionsMixin` (Django built-in) | Must | `is_active`, `is_staff`, `is_superuser`, `last_login`, `date_joined` funcionam como esperado. |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência no código | Confiança |
|------|--------------------|---------------------|-----------|
| Segurança | Autenticação stateless com JWT HS256 + cookies HttpOnly + SameSite=Lax | `accounts/authentication.py:CookieJWTAuthentication`, `accounts/views.py:75-90` (cookie attrs) | 🟢 |
| Segurança | Senha armazenada como hash (bcrypt via Django `set_password`) | `accounts/models.py:UserManager.create_user` | 🟢 |
| Segurança | `secure = not settings.DEBUG` (cookies só em HTTPS em produção) | `accounts/views.py:88-90` | 🟢 |
| Segurança | Throttling por IP anônimo mitiga brute force em login | `config/settings.py:REST_FRAMEWORK` (throttle_scope `login`, `register`) | 🟢 |
| Segurança | `CSRF_TRUSTED_ORIGINS` configurado para origens confiáveis em produção | `config/settings.py`, ADR-002 | 🟢 |
| Segurança | `SECURE_PROXY_SSL_HEADER` reconhece HTTPS via header do proxy (commit `5d4efa1`) | `config/settings.py` | 🟢 |
| Performance | Token access de curta duração (5min) reduz janela de exposição | `accounts/views.py:84` (max_age=300) | 🟢 |
| Performance | Token refresh de 24h equilibra UX e segurança | `accounts/views.py:88` (max_age=86400) | 🟢 |
| Escalabilidade | Autenticação stateless (JWT) — backend não precisa de store de sessão | ADR-002 | 🟢 |
| Escalabilidade | Validação de role por `request.user.role` em cada request (sem cache de permissões) | `accounts/permissions.py` | 🟡 |
| Disponibilidade | Logout não chama backend (apenas limpa cookies) — tolerante a backend fora | `frontend/src/app/api/auth/logout/route.ts:3-18` | 🟢 |
| Manutenibilidade | Custom User isolado em `accounts/models.py`; pode ser referenciado via `settings.AUTH_USER_MODEL` | `accounts/models.py:User` | 🟢 |
| Manutenibilidade | Permissões DRF isoladas em `accounts/permissions.py` (2 classes) | `accounts/permissions.py:IsAdminRole`, `IsEditorOrAdmin` | 🟢 |
| Auditoria | **Ausência** de log de aprovação/mudança de papel | `accounts/views.py:UserApproveView.post` (223-236) | 🔴 |
| Internacionalização | Mensagens de erro em PT-BR (consistente com UI) | `accounts/views.py:53, 60, 87, 92` | 🟢 |

## Critérios de Aceitação

```gherkin
# Login feliz
Dado que existe um usuário com email "p@exemplo.com", senha "senha123" e approval_status="approved"
Quando POST /api/auth/token/ com body {"email": "p@exemplo.com", "password": "senha123"}
Então o status é 200
E o body contém {"role": "reader|editor|admin", "email": "p@exemplo.com"}
E Set-Cookie define access_token (path=/, HttpOnly, max_age=300) e refresh_token (path=/api/auth/token/refresh/, HttpOnly, max_age=86400)

# Login com conta pending
Dado que existe um usuário com email "p@exemplo.com" e approval_status="pending"
Quando POST /api/auth/token/ com credenciais válidas
Então o status é 403
E o body contém mensagem "Sua conta aguarda aprovação" (PT-BR)

# Login com credenciais inválidas
Dado que não existe usuário com email "x@exemplo.com"
Quando POST /api/auth/token/ com body {"email": "x@exemplo.com", "password": "qualquer"}
Então o status é 401
E o body contém mensagem de erro de autenticação (PT-BR)

# Login com rate limit excedido
Dado que 5 requisições de login foram feitas no último minuto do mesmo IP
Quando POST /api/auth/token/ (6ª requisição)
Então o status é 429

# Refresh access_token
Dado que existe um refresh_token válido no cookie
Quando POST /api/auth/token/refresh/ com esse cookie
Então o status é 200
E Set-Cookie define novo access_token
E body é vazio

# Refresh sem cookie
Quando POST /api/auth/token/refresh/ sem cookie refresh_token
Então o status é 401
E o body contém mensagem PT-BR

# Registro feliz
Quando POST /api/auth/register/ com body {"email": "novo@exemplo.com", "password": "senha123"}
Então o status é 201
E o usuário criado tem approval_status="pending" e role="reader"
E o body contém {"email": "novo@exemplo.com"}

# Registro com email duplicado
Dado que já existe usuário com email "p@exemplo.com"
Quando POST /api/auth/register/ com esse email
Então o status é 400
E o body contém mensagem "Email já cadastrado" (PT-BR)

# Registro com senha curta
Quando POST /api/auth/register/ com password de 7 caracteres
Então o status é 400
E o body contém erro de validação de senha (≥8 chars)

# Listar usuários como admin
Dado que sou admin autenticado
Quando GET /api/auth/users/
Então o status é 200
E o body é uma lista ordenada por created_at desc

# Listar usuários como não-admin
Dado que sou reader ou editor
Quando GET /api/auth/users/
Então o status é 403

# Aprovar usuário como admin
Dado que sou admin autenticado e existe usuário com id=42 e approval_status="pending"
Quando POST /api/auth/users/42/approve/
Então o status é 200
E o usuário 42 tem approval_status="approved"

# Aprovar usuário inexistente
Quando POST /api/auth/users/9999/approve/ (não existe)
Então o status é 404

# Mudar role para admin
Dado que sou admin autenticado e existe usuário com id=5
Quando PATCH /api/auth/users/5/ com body {"role": "editor"}
Então o status é 200
E o usuário 5 tem role="editor"

# Mudar role para valor inválido
Quando PATCH /api/auth/users/5/ com body {"role": "superuser"}
Então o status é 400
E o body contém mensagem "papel inválido" (PT-BR)
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| Login com aprovação gate | Must | Caminho crítico: nenhum usuário consegue usar o sistema sem isso |
| Refresh automático de token | Must | Sem isso, sessão expira a cada 5min; UX inviável |
| Registro com aprovação pending | Must | Único caminho de criação de conta |
| Permissões RBAC (IsAdminRole, IsEditorOrAdmin) | Must | Toda escrita em domínio depende disso |
| Cookies HttpOnly + SameSite=Lax | Must | Mitiga XSS e CSRF |
| Throttling de login (5/min) | Must | Mitiga brute force |
| Validação de senha ≥ 8 chars | Must | Política mínima de segurança |
| Logout limpa cookies | Should | Necessário para UX; sem invalidação de JWT é aceitável como gap conhecido |
| Throttling de registro (3/min) | Should | Mitiga criação em massa |
| Listagem de usuários (admin) | Should | Necessário para fluxo de aprovação; pode ser substituído por Django admin |
| Auditoria de aprovação | Won't (gap) | R-USER-08 — gap conhecido, manter como melhoria futura |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---------|-----------------|-----------|
| `backend/accounts/models.py` | `User`, `UserManager` | 🟢 |
| `backend/accounts/models.py:16-30` | `UserManager.create_user` (R-USER-01, R-USER-02) | 🟢 |
| `backend/accounts/models.py:32-49` | `UserManager.create_superuser` (defaults `is_staff`/`is_superuser`) | 🟢 |
| `backend/accounts/serializers.py:19-25` | `EmailTokenObtainPairSerializer.get_token` (claims `role`, `email`) | 🟢 |
| `backend/accounts/serializers.py:27-41` | `EmailTokenObtainPairSerializer.validate` (R-USER-04) | 🟢 |
| `backend/accounts/serializers.py:53-57` | `RegisterSerializer.validate_password` (R-USER-03) | 🟢 |
| `backend/accounts/serializers.py:59-65` | `RegisterSerializer.create` (R-USER-02) | 🟢 |
| `backend/accounts/views.py:47-96` | `TokenObtainCookieView.post` (RF-01) | 🟢 |
| `backend/accounts/views.py:118-156` | `TokenRefreshCookieView.post` (RF-03) | 🟢 |
| `backend/accounts/views.py:182-197` | `RegisterView.create` (RF-04..06) | 🟢 |
| `backend/accounts/views.py:200-209` | `UserListView.get` (RF-07) | 🟢 |
| `backend/accounts/views.py:223-236` | `UserApproveView.post` (RF-08, R-USER-08) | 🟢 / 🔴 |
| `backend/accounts/views.py:254-275` | `UserRoleUpdateView.patch` (RF-09, R-USER-09) | 🟢 / 🟡 |
| `backend/accounts/urls.py` | URLs de accounts | 🟢 |
| `backend/accounts/authentication.py:13-17` | `CookieJWTAuthentication.authenticate` (RF-16) | 🟢 |
| `backend/accounts/permissions.py:7-11` | `IsAdminRole.has_permission` (R-USER-05) | 🟢 |
| `backend/accounts/permissions.py:17-20` | `IsEditorOrAdmin.has_permission` (R-USER-06) | 🟢 |
| `backend/accounts/migrations/0001_initial.py` | Schema do `User` | 🟢 |
| `backend/accounts/tests/` | 2 arquivos de teste (~8 testes inferidos) | 🟡 |
| `frontend/src/app/api/auth/login/route.ts:46-61` | Login route handler (forwarda Set-Cookie) | 🟢 |
| `frontend/src/app/api/auth/logout/route.ts:3-18` | Logout route handler (clear cookies, R-AUTH-11) | 🟢 / 🟡 |
| `frontend/src/contexts/AuthContext.tsx` | Estado global de auth | 🟢 |
| `frontend/src/middleware.ts:13-24` | Guard de borda (R-AUTH-01) | 🟢 |
| `_reversa_sdd/adrs/001-approval-gate.md` | Aprovação de novos usuários via admin | 🟢 |
| `_reversa_sdd/adrs/002-jwt-httponly-cookies.md` | JWT em cookies HttpOnly com throttling | 🟢 |
| `_reversa_sdd/adrs/008-approval-status-orthogonal.md` | Approval status ortogonal a role | 🟢 |
| `_reversa_sdd/adrs/010-custom-user-email.md` | Custom User com email como identificador | 🟢 |
