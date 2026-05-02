# Implementation Plan: API Authentication Strategy

## Overview

Implementação da estratégia de autenticação JWT para o Podigger, cobrindo o backend Django REST Framework (Python) e o frontend Next.js 16 (TypeScript). Os tokens são armazenados em cookies HttpOnly, o frontend usa Route Handlers como proxy server-side, e o controle de acesso é baseado em papéis (Admin, Editor, Reader).

## Tasks

- [x] 1. Criar app `accounts` e modelo de usuário customizado no backend
  - Criar o app Django `accounts` com `python manage.py startapp accounts`
  - Implementar `User` em `accounts/models.py` herdando de `AbstractBaseUser` e `PermissionsMixin` com campos `email`, `role`, `approval_status`, `is_active`, `is_staff`, `created_at`
  - Implementar `UserManager` com métodos `create_user` e `create_superuser`
  - Definir `AUTH_USER_MODEL = "accounts.User"` em `config/settings.py`
  - Adicionar `"accounts"` a `INSTALLED_APPS` em `config/settings.py`
  - Gerar e aplicar a migration inicial do modelo
  - _Requirements: 1.7, 4.1, 4.3, 4.5_

- [x] 2. Instalar dependências e configurar `djangorestframework-simplejwt`
  - Adicionar `djangorestframework-simplejwt==5.4.0` e `hypothesis==6.135.0` a `requirements.txt`
  - Adicionar `rest_framework_simplejwt` a `INSTALLED_APPS`
  - Configurar bloco `SIMPLE_JWT` em `config/settings.py` com `ACCESS_TOKEN_LIFETIME`, `REFRESH_TOKEN_LIFETIME`, `TOKEN_OBTAIN_SERIALIZER` apontando para `accounts.serializers.EmailTokenObtainPairSerializer`
  - Adicionar variáveis `JWT_ACCESS_TOKEN_MINUTES` e `JWT_REFRESH_TOKEN_DAYS` ao `backend/.env.production.example`
  - _Requirements: 1.4, 1.5, 14.1_

- [x] 3. Implementar autenticação por cookie e serializer customizado
  - [x] 3.1 Implementar `CookieJWTAuthentication` em `accounts/authentication.py` lendo o token do cookie `access_token`
    - Herdar de `JWTAuthentication` e sobrescrever `authenticate` para ler `request.COOKIES.get("access_token")`
    - Retornar `None` quando o cookie estiver ausente (permite acesso público)
    - _Requirements: 5.7, 14.5_

  - [x] 3.2 Implementar `EmailTokenObtainPairSerializer` em `accounts/serializers.py`
    - Herdar de `TokenObtainPairSerializer`, sobrescrever `username_field = "email"`
    - Verificar `approval_status == "approved"` e lançar `AuthenticationFailed` com mensagem adequada se `pending`
    - Incluir `role` e `email` no payload do token e no retorno do `validate()`
    - _Requirements: 1.1, 1.3, 1.7, 1.8_

  - [x] 3.3 Atualizar `REST_FRAMEWORK` em `config/settings.py`
    - Adicionar `CookieJWTAuthentication` como primeira classe em `DEFAULT_AUTHENTICATION_CLASSES`
    - Manter `SessionAuthentication` e `BasicAuthentication` para o Django Admin
    - _Requirements: 11.1, 11.2, 11.3_

  - [x]* 3.4 Escrever property test para autenticação por cookie (Property 13)
    - **Property 13: Token lido exclusivamente do cookie**
    - **Validates: Requirements 5.7, 14.5**

- [x] 4. Implementar views de token com cookies HttpOnly
  - [x] 4.1 Implementar `TokenObtainCookieView` em `accounts/views.py`
    - Herdar de `TokenObtainPairView`, sobrescrever `post()` para definir cookies `access_token` e `refresh_token` com atributos `HttpOnly`, `Secure` (quando `not DEBUG`), `SameSite=Lax`
    - Retornar apenas `{"role": "...", "email": "..."}` no body (sem tokens)
    - Retornar HTTP 401 para credenciais inválidas e HTTP 403 para conta `pending`
    - _Requirements: 1.1, 1.2, 1.3, 1.8, 7.1, 7.2_

  - [x] 4.2 Implementar `TokenRefreshCookieView` em `accounts/views.py`
    - Herdar de `TokenRefreshView`, ler `refresh_token` do cookie, emitir novo `access_token` via cookie HttpOnly
    - Retornar HTTP 401 quando o cookie `refresh_token` estiver ausente, expirado ou inválido
    - _Requirements: 2.1, 2.2_

  - [x] 4.3 Escrever property test para emissão de tokens (Property 1)
    - **Property 1: Login bem-sucedido emite tokens e retorna role/email**
    - **Validates: Requirements 1.1, 1.8**

  - [x] 4.4 Escrever property test para expiração do access token (Property 2)
    - **Property 2: Expiração do Access Token**
    - **Validates: Requirements 1.4**

  - [ ]* 4.5 Escrever property test para expiração do refresh token (Property 3)
    - **Property 3: Expiração do Refresh Token**
    - **Validates: Requirements 1.5**

  - [ ]* 4.6 Escrever property test para autenticação por email (Property 4)
    - **Property 4: Autenticação por email**
    - **Validates: Requirements 1.7**

  - [ ]* 4.7 Escrever property test para renovação de token (Property 5)
    - **Property 5: Renovação de token (round-trip)**
    - **Validates: Requirements 2.1**

  - [ ]* 4.8 Escrever property test para atributos de segurança dos cookies (Property 15)
    - **Property 15: Atributos de segurança dos cookies**
    - **Validates: Requirements 7.1, 7.2**

- [x] 5. Checkpoint — Verificar autenticação base
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.

- [x] 6. Implementar classes de permissão e views de gerenciamento de usuários
  - [x] 6.1 Implementar `IsAdminRole` e `IsEditorOrAdmin` em `accounts/permissions.py`
    - `IsAdminRole`: verifica `request.user.is_authenticated and request.user.role == "admin"`
    - `IsEditorOrAdmin`: verifica `request.user.is_authenticated and request.user.role in ("editor", "admin")`
    - _Requirements: 5.2, 5.3, 5.5, 5.6_

  - [x] 6.2 Criar `accounts/serializers.py` com `UserSerializer` e `RegisterSerializer`
    - `RegisterSerializer`: campos `email`, `password`; validação de comprimento mínimo de 8 caracteres
    - `UserSerializer`: campos `id`, `email`, `role`, `approval_status`, `created_at`
    - _Requirements: 3.2, 3.4, 3.5, 4.3_

  - [x] 6.3 Implementar `RegisterView` em `accounts/views.py`
    - Endpoint público `POST /api/auth/register/` sem autenticação
    - Criar conta com `approval_status="pending"` e `role="reader"`
    - Validar senha mínima de 8 caracteres; retornar HTTP 400 com mensagem descritiva se inválida
    - Retornar HTTP 400 com mensagem descritiva se email já existir
    - Retornar HTTP 201 em sucesso
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 6.4 Implementar `UserListView`, `UserApproveView` e `UserRoleUpdateView` em `accounts/views.py`
    - `UserListView`: `GET /api/auth/users/` restrito a `IsAdminRole`
    - `UserApproveView`: `POST /api/auth/users/{id}/approve/` restrito a `IsAdminRole`, atualiza `approval_status` para `"approved"`
    - `UserRoleUpdateView`: `PATCH /api/auth/users/{id}/` restrito a `IsAdminRole`, valida que `role` é um dos valores aceitos (`admin`, `editor`, `reader`)
    - Retornar HTTP 403 para não-Admin e HTTP 400 para papel inválido
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 6.5 Escrever property test para registro (Property 6)
    - **Property 6: Registro cria conta com status pending e role reader**
    - **Validates: Requirements 3.2**

  - [ ]* 6.6 Escrever property test para validação de senha (Property 7)
    - **Property 7: Validação de senha no registro**
    - **Validates: Requirements 3.4, 3.5**

  - [ ]* 6.7 Escrever property test para controle de acesso admin (Property 8)
    - **Property 8: Controle de acesso admin (consolidado)**
    - **Validates: Requirements 4.1, 4.3, 4.4, 4.5, 5.6**

  - [ ]* 6.8 Escrever property test para aprovação de conta (Property 9)
    - **Property 9: Aprovação de conta muda status para approved**
    - **Validates: Requirements 4.2**

  - [ ]* 6.9 Escrever property test para papel inválido (Property 10)
    - **Property 10: Validação de papel inválido**
    - **Validates: Requirements 4.6**

- [x] 7. Configurar URLs do app `accounts` e atualizar `config/urls.py`
  - Criar `accounts/urls.py` com rotas: `token/`, `token/refresh/`, `register/`, `users/`, `users/<int:pk>/approve/`, `users/<int:pk>/`
  - Incluir `accounts.urls` em `config/urls.py` sob o prefixo `api/auth/`
  - _Requirements: 1.6, 3.1, 4.1, 4.3, 4.5_

- [x] 8. Aplicar permissões de papel nos ViewSets de conteúdo existentes
  - Atualizar `PodcastViewSet` em `podcasts/views.py` para exigir `IsEditorOrAdmin` em operações de escrita (`create`, `update`, `partial_update`, `destroy`)
  - Aplicar a mesma lógica a `EpisodeViewSet` e `TopicSuggestionViewSet`
  - Manter leitura pública (`GET`) sem autenticação para todos os ViewSets de conteúdo
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4_

  - [ ]* 8.1 Escrever property test para autenticação obrigatória em escrita (Property 11)
    - **Property 11: Autenticação obrigatória para escrita (consolidado)**
    - **Validates: Requirements 5.1, 5.4**

  - [ ]* 8.2 Escrever property test para Reader não pode escrever (Property 12)
    - **Property 12: Reader não pode escrever (consolidado)**
    - **Validates: Requirements 5.2, 5.5**

  - [ ]* 8.3 Escrever property test para leitura pública (Property 14)
    - **Property 14: Leitura pública sem autenticação**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

  - [ ]* 8.4 Escrever property test para logout apaga cookies (Property 16)
    - **Property 16: Logout apaga cookies**
    - **Validates: Requirements 10.1**

- [x] 9. Configurar CORS e CSRF para staging e production
  - Configurar `CORS_ALLOWED_ORIGINS` e `CSRF_TRUSTED_ORIGINS` em `config/settings.py` lendo de variáveis de ambiente
  - Adicionar domínios de staging (`api.podigger.perna.app`) e production ao `backend/.env.production.example`
  - _Requirements: 14.4_

- [x] 10. Checkpoint — Verificar backend completo
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.

- [x] 11. Criar `AuthContext` e `AuthProvider` no frontend
  - Criar `src/contexts/AuthContext.tsx` com interface `AuthState { user: { email: string; role: "admin" | "editor" | "reader" } | null; isAuthenticated: boolean; isLoading: boolean }`
  - Implementar `AuthProvider` com estado em memória, funções `login(role, email)`, `logout()` e `setUser()`
  - Envolver o layout raiz (`src/app/layout.tsx`) com `AuthProvider`
  - _Requirements: 7.3, 7.4, 8.2, 8.7_

- [x] 12. Instalar `fast-check` e configurar testes de propriedade no frontend
  - Adicionar `fast-check` versão `3.23.2` a `devDependencies` em `frontend/package.json`
  - Criar diretório `frontend/src/__tests__/auth/` para os testes de propriedade do frontend
  - _Requirements: (suporte a Properties 17–18)_

- [x] 13. Implementar Route Handlers de autenticação no frontend
  - [x] 13.1 Criar `src/app/api/auth/login/route.ts`
    - Receber `{ email, password }` do browser, encaminhar para `POST /api/auth/token/` no backend
    - Repassar cookies HttpOnly e body `{ role, email }` para o browser
    - Retornar 503 em erro de rede; repassar 401/403 com body original do backend
    - _Requirements: 8.1, 8.5, 7.1, 7.2_

  - [x] 13.2 Criar `src/app/api/auth/logout/route.ts`
    - Apagar cookies `access_token` e `refresh_token` via `Set-Cookie` com `Max-Age=0`
    - _Requirements: 10.1, 10.3_

  - [x] 13.3 Criar `src/app/api/auth/refresh/route.ts`
    - Encaminhar cookie `refresh_token` para `POST /api/auth/token/refresh/` no backend
    - Repassar novo cookie `access_token` para o browser
    - _Requirements: 2.1, 2.2_

  - [x] 13.4 Criar `src/app/api/auth/register/route.ts`
    - Receber `{ email, password }` do browser, encaminhar para `POST /api/auth/register/` no backend
    - Repassar status 201 ou erros 400 com body original
    - _Requirements: 3.1, 3.6_

- [x] 14. Implementar proxy genérico para endpoints autenticados
  - Criar `src/app/api/proxy/[...path]/route.ts` que encaminha requisições autenticadas ao backend incluindo o cookie `access_token`
  - Implementar lógica de retry: em caso de 401, tentar refresh via `/api/auth/refresh`; se refresh falhar, acionar logout (limpar cookies) e redirecionar para `/auth/unauthorized?next=<path>`
  - Suportar métodos `GET`, `POST`, `PUT`, `PATCH`, `DELETE`
  - _Requirements: 2.3, 2.4, 9.3, 13.7_

- [x] 15. Implementar middleware de proteção de rotas
  - Criar `src/middleware.ts` verificando o estado de autenticação para rotas protegidas
  - Redirecionar para `/auth/unauthorized?next=<url>` quando o usuário não estiver autenticado
  - Definir `matcher` para rotas que requerem autenticação (ex: `/add-podcast`, rotas admin)
  - _Requirements: 8.6, 13.5_

  - [ ]* 15.1 Escrever property test para redirecionamento preserva URL de origem (Property 17)
    - **Property 17: Redirecionamento preserva URL de origem**
    - **Validates: Requirements 13.5**

- [x] 16. Criar páginas de autenticação no frontend
  - [x] 16.1 Criar `src/app/login/page.tsx`
    - Formulário com campos `email` e `password`
    - Submeter via Route Handler `/api/auth/login`
    - Em sucesso: armazenar `role` e `email` no `AuthContext` e redirecionar para `?next` ou `/`
    - Em conta `pending`: exibir mensagem sem redirecionar
    - Em credenciais inválidas: exibir mensagem de erro genérica inline
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.7_

  - [x] 16.2 Criar `src/app/register/page.tsx`
    - Formulário com campos `email`, `password` e `password_confirm`
    - Submeter via Route Handler `/api/auth/register`
    - Em sucesso: exibir mensagem informando que a conta aguarda aprovação
    - Em erro: exibir mensagem descritiva inline
    - _Requirements: 3.6, 3.7_

  - [x] 16.3 Criar páginas de erro de autenticação
    - `src/app/auth/unauthorized/page.tsx`: mensagem para não autenticado + link para `/login` + preservar `?next`
    - `src/app/auth/forbidden/page.tsx`: mensagem para acesso negado + papel atual do usuário + link para `/`
    - `src/app/auth/pending/page.tsx`: mensagem informando que a conta aguarda aprovação
    - _Requirements: 13.1, 13.2, 13.3, 13.6_

- [x] 17. Atualizar componentes existentes para controle de visibilidade por papel
  - Atualizar o formulário de cadastro de podcast para renderizar apenas quando `role === "editor"` ou `role === "admin"` (lendo do `AuthContext`)
  - Atualizar `Navbar` para exibir links de login/logout conforme estado de autenticação
  - Enviar requisições de escrita de podcast via proxy Route Handler em vez de `fetch` direto
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ]* 17.1 Escrever property test para visibilidade do formulário de podcast por papel (Property 18)
    - **Property 18: Visibilidade do formulário de podcast por papel**
    - **Validates: Requirements 9.1**

- [x] 18. Checkpoint final — Garantir que todos os testes passam
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.

## Notes

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada tarefa referencia requisitos específicos para rastreabilidade
- Os checkpoints garantem validação incremental
- Os testes de propriedade usam `hypothesis==6.135.0` no backend (Python) e `fast-check==3.23.2` no frontend (TypeScript)
- Os testes de propriedade do backend devem usar banco de dados SQLite em memória ou fixtures isoladas
- Os testes de propriedade do frontend devem mockar chamadas de rede
- Cada teste de propriedade deve ter no mínimo 100 iterações e comentário de tag no formato: `# Feature: api-authentication-strategy, Property N: <texto>`
- O Django Admin continua usando autenticação por sessão — não deve ser afetado pelas mudanças
- Properties 1–16 são testadas no backend com `hypothesis`; Properties 17–18 são testadas no frontend com `fast-check`
