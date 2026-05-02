# Requirements Document

## Introduction

O Podigger é uma aplicação web composta por um backend Django REST Framework e um frontend Next.js 16 (App Router). Atualmente, a API não possui nenhuma estratégia de autenticação entre os dois serviços: o frontend consome endpoints públicos via `fetch` simples, e o backend usa `IsAuthenticatedOrReadOnly` como permissão padrão sem nenhum mecanismo de token configurado.

Esta feature define a estratégia de autenticação entre o frontend Next.js e o backend DRF, usando **JWT (JSON Web Tokens)** como mecanismo de autenticação stateless para a API. O painel Django Admin continuará usando autenticação por sessão nativa, sem alterações.

O modelo de acesso é baseado em **papéis de usuário** (Admin, Editor, Leitor). Qualquer pessoa pode criar uma conta pelo frontend, mas a conta precisa ser aprovada por um Admin antes de ter acesso a operações de escrita. Visitantes sem conta continuam podendo navegar e buscar conteúdo livremente. A segurança de escrita é baseada exclusivamente em autenticação de usuários — não há API Key de servidor.

A estratégia deve funcionar de forma consistente nos ambientes de staging e production, respeitando a infraestrutura existente de Docker Compose + Nginx.

---

## Glossary

- **API**: O backend Django REST Framework acessível em `/api/`.
- **Admin_Panel**: O painel Django Admin acessível em `/admin/`, que usa autenticação por sessão nativa do Django.
- **Frontend**: A aplicação Next.js 16 com App Router.
- **JWT**: JSON Web Token — par de tokens (access + refresh) usado para autenticar requisições à API.
- **Access_Token**: Token JWT de curta duração (ex: 5 minutos) armazenado em cookie `HttpOnly` e enviado automaticamente pelo browser em cada requisição autenticada.
- **Refresh_Token**: Token JWT de longa duração (ex: 1 dia) armazenado em cookie `HttpOnly` separado e usado para obter novos Access_Tokens sem reautenticação.
- **Token_Endpoint**: Endpoint DRF responsável por emitir e renovar tokens JWT (`/api/auth/token/` e `/api/auth/token/refresh/`).
- **Protected_Endpoint**: Qualquer endpoint da API que exige autenticação e papel adequado para operações de escrita (POST, PUT, PATCH, DELETE).
- **Public_Endpoint**: Qualquer endpoint da API que permite leitura sem autenticação (GET).
- **Route_Handler**: Função de servidor do Next.js App Router (`app/api/`) que atua como proxy entre o browser e a API, protegendo credenciais.
- **HttpOnly_Cookie**: Cookie inacessível via JavaScript do browser, usado para armazenar tanto o Access_Token quanto o Refresh_Token com segurança contra ataques XSS.
- **Auth_Cookie**: Nome genérico para os cookies HttpOnly que transportam os tokens JWT — `access_token` e `refresh_token`.
- **Visitor**: Usuário não autenticado que acessa o Podigger sem conta ou sem estar logado.
- **Registered_User**: Usuário que criou uma conta pelo frontend mas ainda não foi aprovado por um Admin.
- **Approved_User**: Usuário com conta aprovada por um Admin, com papel atribuído (Admin, Editor ou Leitor).
- **Admin_Role**: Papel de usuário com acesso total — gerenciar usuários, aprovar contas, CRUD completo em todos os recursos.
- **Editor_Role**: Papel de usuário que pode cadastrar podcasts e editar conteúdo.
- **Reader_Role**: Papel de usuário com acesso apenas a leitura.
- **Approval_Status**: Estado da conta de um usuário — `pending` (aguardando aprovação) ou `approved` (aprovado por um Admin).
- **Registration_Endpoint**: Endpoint público da API responsável por criar novas contas de usuário (`/api/auth/register/`).

---

## Requirements

### Requirement 1: Emissão de Tokens JWT pelo Backend

**User Story:** Como Approved_User, quero me autenticar na API com meu email e senha, para que eu possa obter tokens JWT e realizar operações de escrita conforme meu papel.

#### Acceptance Criteria

1. WHEN um `POST /api/auth/token/` é recebido com `email` e `password` válidos de um Approved_User, THE Token_Endpoint SHALL retornar HTTP 200 com o papel do usuário (`role`) no corpo da resposta, e definir os cookies HttpOnly `access_token` e `refresh_token`.
2. WHEN um `POST /api/auth/token/` é recebido com credenciais inválidas, THE Token_Endpoint SHALL retornar HTTP 401 com mensagem de erro descritiva.
3. WHEN um `POST /api/auth/token/` é recebido com credenciais válidas de um Registered_User com Approval_Status `pending`, THE Token_Endpoint SHALL retornar HTTP 403 com mensagem indicando que a conta aguarda aprovação.
4. THE Token_Endpoint SHALL emitir Access_Tokens com tempo de expiração máximo de 5 minutos.
5. THE Token_Endpoint SHALL emitir Refresh_Tokens com tempo de expiração máximo de 1 dia.
6. THE API SHALL expor o Token_Endpoint em `/api/auth/token/` e o endpoint de renovação em `/api/auth/token/refresh/`.
7. THE Token_Endpoint SHALL autenticar o usuário pelo campo `email` — não pelo `username` padrão do Django.
8. THE Token_Endpoint SHALL retornar o papel do usuário (`role`) e o `email` no corpo da resposta de login, pois o Access_Token em HttpOnly cookie não é legível pelo JavaScript do browser.

---

### Requirement 2: Renovação de Access Token via Refresh Token

**User Story:** Como Approved_User autenticado, quero que meu Access_Token seja renovado automaticamente, para que minha sessão não expire durante o uso normal da aplicação.

#### Acceptance Criteria

1. WHEN um `POST /api/auth/token/refresh/` é recebido com o cookie `refresh_token` válido e não expirado, THE Token_Endpoint SHALL retornar HTTP 200 e redefinir o cookie HttpOnly `access_token` com um novo Access_Token.
2. WHEN um `POST /api/auth/token/refresh/` é recebido com o cookie `refresh_token` expirado, ausente ou inválido, THE Token_Endpoint SHALL retornar HTTP 401.
3. WHEN o Frontend recebe HTTP 401 em uma requisição autenticada, THE Frontend SHALL tentar renovar o Access_Token via Route_Handler antes de redirecionar o usuário para login.
4. IF a renovação do Access_Token falhar, THEN THE Frontend SHALL redirecionar o usuário para a página de login e acionar o logout para limpar os cookies de autenticação.

---

### Requirement 3: Registro Público de Contas

**User Story:** Como Visitor, quero criar uma conta pelo frontend do Podigger, para que eu possa solicitar acesso às funcionalidades de escrita da plataforma.

#### Acceptance Criteria

1. THE Registration_Endpoint SHALL aceitar requisições `POST /api/auth/register/` sem autenticação.
2. WHEN um `POST /api/auth/register/` é recebido com `email` e `password` válidos, THE Registration_Endpoint SHALL criar uma conta com Approval_Status `pending` e papel Reader_Role por padrão, e retornar HTTP 201.
3. WHEN um `POST /api/auth/register/` é recebido com `email` já existente, THE Registration_Endpoint SHALL retornar HTTP 400 com mensagem de erro descritiva.
4. WHEN um `POST /api/auth/register/` é recebido com `password` que não atende aos critérios mínimos de segurança, THE Registration_Endpoint SHALL retornar HTTP 400 com mensagem descritiva dos critérios não atendidos.
5. THE Registration_Endpoint SHALL exigir `password` com no mínimo 8 caracteres.
6. THE Frontend SHALL disponibilizar uma rota `/register` com formulário de criação de conta contendo campos `email`, `password` e `password_confirm`.
7. WHEN o registro é concluído com sucesso, THE Frontend SHALL exibir mensagem informando que a conta foi criada e aguarda aprovação de um administrador.

---

### Requirement 4: Aprovação de Contas por Admin

**User Story:** Como Admin_Role, quero aprovar ou rejeitar contas de usuários registrados, para que apenas pessoas autorizadas tenham acesso às funcionalidades de escrita da plataforma.

#### Acceptance Criteria

1. THE API SHALL expor um endpoint `POST /api/auth/users/{id}/approve/` acessível exclusivamente por usuários com papel Admin_Role.
2. WHEN um `POST /api/auth/users/{id}/approve/` é recebido com Access_Token válido de um Admin_Role, THE API SHALL atualizar o Approval_Status do usuário para `approved` e retornar HTTP 200.
3. THE API SHALL expor um endpoint `GET /api/auth/users/` acessível exclusivamente por usuários com papel Admin_Role, retornando a lista de usuários com seus papéis e Approval_Status.
4. WHEN um `POST /api/auth/users/{id}/approve/` é recebido sem Access_Token válido ou com papel diferente de Admin_Role, THE API SHALL retornar HTTP 403.
5. THE API SHALL expor um endpoint `PATCH /api/auth/users/{id}/` acessível exclusivamente por Admin_Role para atualizar o papel de um usuário.
6. WHEN um `PATCH /api/auth/users/{id}/` é recebido com papel inválido, THE API SHALL retornar HTTP 400 com mensagem de erro descritiva.

---

### Requirement 5: Controle de Acesso Baseado em Papéis

**User Story:** Como operador do sistema, quero que as operações de escrita na API sejam restritas por papel de usuário, para que cada tipo de usuário acesse apenas as funcionalidades correspondentes ao seu papel.

#### Acceptance Criteria

1. WHEN uma requisição `POST /api/podcasts/` é recebida sem Access_Token válido, THE API SHALL retornar HTTP 401.
2. WHEN uma requisição `POST /api/podcasts/` é recebida com Access_Token válido de um usuário com papel Reader_Role, THE API SHALL retornar HTTP 403.
3. WHEN uma requisição `POST /api/podcasts/` é recebida com Access_Token válido de um usuário com papel Editor_Role ou Admin_Role, THE API SHALL processar a requisição normalmente.
4. WHEN uma requisição `PUT`, `PATCH` ou `DELETE` em qualquer recurso é recebida sem Access_Token válido, THE API SHALL retornar HTTP 401.
5. WHEN uma requisição `PUT`, `PATCH` ou `DELETE` em qualquer recurso é recebida com Access_Token válido de um usuário com papel Reader_Role, THE API SHALL retornar HTTP 403.
6. WHEN uma requisição de gerenciamento de usuários é recebida com Access_Token válido de um usuário com papel diferente de Admin_Role, THE API SHALL retornar HTTP 403.
7. THE API SHALL ler o Access_Token exclusivamente do cookie HttpOnly `access_token` — não via header `Authorization` ou query string.

---

### Requirement 6: Acesso Público a Endpoints de Leitura

**User Story:** Como Visitor do Podigger, quero acessar podcasts, episódios e termos populares sem precisar me autenticar, para que o conteúdo seja acessível publicamente.

#### Acceptance Criteria

1. WHEN uma requisição `GET /api/podcasts/` é recebida sem autenticação, THE API SHALL retornar HTTP 200 com a lista de podcasts.
2. WHEN uma requisição `GET /api/episodes/` é recebida sem autenticação, THE API SHALL retornar HTTP 200 com a lista de episódios.
3. WHEN uma requisição `GET /api/popular-terms/` é recebida sem autenticação, THE API SHALL retornar HTTP 200 com a lista de termos populares.
4. THE API SHALL aplicar permissão de leitura pública a todos os ViewSets de conteúdo, exigindo autenticação e papel adequado apenas para operações de escrita.

---

### Requirement 7: Armazenamento Seguro dos Tokens no Frontend

**User Story:** Como Approved_User, quero que meus tokens JWT sejam armazenados de forma segura no browser, para que não sejam acessíveis via JavaScript e não possam ser roubados por ataques XSS.

#### Acceptance Criteria

1. THE Frontend SHALL armazenar o Access_Token exclusivamente em um HttpOnly_Cookie com atributo `Secure` em ambientes de staging e production.
2. THE Frontend SHALL armazenar o Refresh_Token exclusivamente em um HttpOnly_Cookie separado com atributo `Secure` em ambientes de staging e production.
3. THE Frontend SHALL armazenar o papel do usuário (`role`) e o `email` em memória (estado React/contexto) após o login — esses dados não são sensíveis e são necessários para controle de visibilidade da interface.
4. WHEN o browser é fechado ou a sessão é encerrada, THE Frontend SHALL descartar o estado de autenticação em memória.
5. THE Route_Handler SHALL ser o único componente do Frontend que lê e envia os Auth_Cookies para o Token_Endpoint — o código client-side não deve ter acesso direto aos tokens.

---

### Requirement 8: Fluxo de Login no Frontend

**User Story:** Como Approved_User, quero uma página de login no frontend, para que eu possa me autenticar e acessar funcionalidades protegidas conforme meu papel.

#### Acceptance Criteria

1. THE Frontend SHALL disponibilizar uma rota `/login` com formulário de autenticação contendo campos `email` e `password`.
2. WHEN o formulário de login é submetido com credenciais válidas de um Approved_User, THE Frontend SHALL armazenar o papel (`role`) e o `email` retornados pela API em memória, e redirecionar o usuário para a página anterior ou para `/`.
3. WHEN o formulário de login é submetido com credenciais de um Registered_User com Approval_Status `pending`, THE Frontend SHALL exibir mensagem informando que a conta aguarda aprovação, sem redirecionar.
4. WHEN o formulário de login é submetido com credenciais inválidas, THE Frontend SHALL exibir mensagem de erro sem revelar detalhes sobre qual campo está incorreto.
5. THE Frontend SHALL enviar as credenciais de login exclusivamente via Route_Handler server-side — nunca diretamente do browser para a API.
6. WHEN o usuário acessa uma rota protegida sem estado de autenticação válido em memória, THE Frontend SHALL redirecionar para `/login`.
7. WHEN o login é concluído com sucesso, THE Frontend SHALL armazenar o papel do usuário (`role`) e o `email` retornados pela API em memória para controle de visibilidade de elementos da interface.

---

### Requirement 9: Cadastro de Podcast pelo Frontend

**User Story:** Como Editor_Role ou Admin_Role autenticado, quero acessar o formulário de cadastro de podcast no frontend, para que eu possa adicionar novos podcasts à plataforma.

#### Acceptance Criteria

1. THE Frontend SHALL exibir o formulário de cadastro de podcast exclusivamente para usuários autenticados com papel Editor_Role ou Admin_Role.
2. WHEN um Visitor ou Reader_Role tenta acessar a rota de cadastro de podcast, THE Frontend SHALL redirecionar para `/login` ou exibir mensagem de acesso negado, conforme o estado de autenticação.
3. WHEN o formulário de cadastro de podcast é submetido por um Editor_Role ou Admin_Role autenticado, THE Frontend SHALL enviar a requisição `POST /api/podcasts/` via Route_Handler, que incluirá automaticamente o Auth_Cookie `access_token` na requisição ao backend.
4. WHEN a requisição de cadastro de podcast retorna HTTP 401 ou HTTP 403, THE Frontend SHALL exibir mensagem de erro adequada sem expor detalhes internos.

---

### Requirement 10: Logout e Invalidação de Sessão

**User Story:** Como Approved_User, quero poder encerrar minha sessão, para que meus tokens sejam descartados e meu acesso seja revogado.

#### Acceptance Criteria

1. WHEN o usuário aciona o logout, THE Frontend SHALL acionar o Route_Handler de logout, que apagará os cookies HttpOnly `access_token` e `refresh_token`, e limpará o estado de autenticação em memória.
2. WHEN o logout é acionado, THE Frontend SHALL redirecionar o usuário para `/`.
3. THE Frontend SHALL disponibilizar a ação de logout via Route_Handler server-side para garantir que o cookie seja apagado com segurança.

---

### Requirement 11: Preservação do Django Admin

**User Story:** Como Admin_Role, quero que o painel Django Admin continue funcionando com autenticação por sessão, para que a gestão de dados não seja afetada pela nova estratégia JWT.

#### Acceptance Criteria

1. THE Admin_Panel SHALL continuar usando autenticação por sessão nativa do Django, sem alterações.
2. THE API SHALL configurar autenticação JWT exclusivamente para os endpoints sob `/api/` — o Admin_Panel não deve ser afetado.
3. WHILE o Django Admin estiver em uso, THE Admin_Panel SHALL manter `SessionAuthentication` e `BasicAuthentication` como backends de autenticação disponíveis para o DRF, além do `JWTAuthentication`.

---

### Requirement 13: Páginas de Erro de Autenticação

**User Story:** Como usuário do Podigger, quero ver páginas de erro claras quando ocorrem problemas de autenticação ou autorização, para que eu entenda o que aconteceu e saiba como proceder.

#### Acceptance Criteria

1. THE Frontend SHALL disponibilizar uma rota `/auth/unauthorized` exibida quando o usuário tenta acessar um recurso sem estar autenticado (equivalente a HTTP 401), com mensagem explicativa e link para `/login`.
2. THE Frontend SHALL disponibilizar uma rota `/auth/forbidden` exibida quando o usuário autenticado tenta acessar um recurso para o qual não tem permissão (equivalente a HTTP 403), com mensagem explicativa e link para `/`.
3. THE Frontend SHALL disponibilizar uma rota `/auth/pending` exibida quando um Registered_User tenta fazer login com conta ainda não aprovada, com mensagem informando que a conta aguarda aprovação de um administrador.
4. WHEN o formulário de login é submetido com `email` ou `password` inválidos, THE Frontend SHALL exibir mensagem de erro inline na rota `/login`, sem redirecionar para outra página.
5. WHEN o usuário é redirecionado para `/auth/unauthorized`, THE Frontend SHALL preservar a URL de origem em um parâmetro de query (ex: `?next=/add-podcast`) para redirecionar de volta após o login bem-sucedido.
6. WHEN o usuário é redirecionado para `/auth/forbidden`, THE Frontend SHALL exibir o papel atual do usuário e uma indicação de qual nível de acesso seria necessário, sem expor detalhes internos da configuração.
7. WHEN a renovação automática do Access_Token falha durante uma sessão ativa, THE Frontend SHALL redirecionar para `/auth/unauthorized` em vez de `/login` diretamente, informando que a sessão expirou.

---

### Requirement 14: Compatibilidade com Staging e Production

**User Story:** Como operador do sistema, quero que a estratégia de autenticação funcione de forma consistente em staging e production, para que não haja diferenças de comportamento entre ambientes.

#### Acceptance Criteria

1. THE API SHALL ler as configurações de expiração de tokens JWT a partir de variáveis de ambiente, com valores padrão seguros para produção.
2. THE Frontend SHALL ler a URL base da API a partir da variável de ambiente `NEXT_PUBLIC_API_URL`, já configurada nos ambientes de staging e production.
3. WHILE `DJANGO_DEBUG=False`, THE API SHALL exigir que o Access_Token seja transmitido exclusivamente via HTTPS — requisições HTTP devem ser rejeitadas pelo Nginx antes de chegar à API.
4. THE API SHALL incluir `CSRF_TRUSTED_ORIGINS` e `CORS_ALLOWED_ORIGINS` configurados via variáveis de ambiente para os domínios de staging (`api.podigger.perna.app`) e production.
5. IF uma requisição autenticada chegar ao backend sem o header `Authorization`, THEN THE API SHALL retornar HTTP 401 sem expor detalhes internos da configuração.
