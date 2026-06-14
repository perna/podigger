# Feature Specification: CRUD de Podcasts

**Feature Branch**: `002-podcast-crud-api`

**Created**: 2026-06-13

**Status**: Draft

**Input**: User description: "criar as apis referentes a crud de podcasts"

## Clarifications

### Session 2026-06-13

- Q: Estratégia de validação da URL do feed RSS no cadastro? → A: Assíncrona — validar formato da URL sincronamente; validar conteúdo RSS (se é feed válido) via tarefa Celery assíncrona
- Q: O campo feed é imutável após criação? → A: Mutável — feed pode ser atualizado, disparando re-importação completa dos episódios do novo feed
- Q: Estratégia de remoção de podcast? → A: Hard delete — remoção permanente do podcast e todos os episódios do banco de dados

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Listar podcasts com paginação e filtros (Priority: P1)

Um usuário (autenticado ou não) acessa a API de podcasts e recebe uma lista paginada
de todos os podcasts cadastrados, com opção de busca por nome e filtro por idioma.

**Why this priority**: A listagem é a operação mais frequente e ponto de partida para
todas as demais operações do CRUD. Sem ela, não há como descobrir podcasts existentes.

**Independent Test**: Fazer uma requisição GET para o endpoint de listagem e verificar
que a resposta contém uma lista paginada de podcasts com metadados de paginação.

**Acceptance Scenarios**:

1. **Given** que existem podcasts cadastrados no sistema, **When** um usuário faz uma
   requisição GET para o endpoint de listagem sem autenticação, **Then** o sistema
   retorna status 200 com uma lista paginada de podcasts contendo nome, imagem, idioma
   e total de episódios.

2. **Given** que existem mais podcasts do que cabem em uma página, **When** o usuário
   requisita a listagem, **Then** a resposta inclui metadados de paginação (contagem
   total, próxima página, página anterior) e retorna no máximo o tamanho de página
   configurado.

3. **Given** que o usuário deseja encontrar um podcast específico, **When** ele faz
   uma requisição GET com parâmetro de busca por nome, **Then** o sistema retorna
   apenas podcasts cujo nome contém o termo buscado.

4. **Given** que o usuário deseja filtrar por idioma, **When** ele faz uma requisição
   GET com parâmetro de filtro por idioma, **Then** o sistema retorna apenas podcasts
   do idioma especificado.

---

### User Story 2 - Visualizar detalhes de um podcast (Priority: P1)

Um usuário (autenticado ou não) acessa a API para ver os detalhes completos de um
podcast específico, incluindo seus episódios associados.

**Why this priority**: A visualização detalhada é essencial para consumo do conteúdo
e complementa a listagem como operação de leitura fundamental.

**Independent Test**: Fazer uma requisição GET para o endpoint de detalhe com um ID
válido e verificar que a resposta contém todas as informações do podcast e seus episódios.

**Acceptance Scenarios**:

1. **Given** que existe um podcast com ID válido, **When** um usuário faz uma requisição
   GET para o endpoint de detalhe, **Then** o sistema retorna status 200 com todos os
   campos do podcast (nome, feed, imagem, idioma, total de episódios) e a lista de
   episódios associados.

2. **Given** que não existe podcast com o ID informado, **When** um usuário faz uma
   requisição GET para o endpoint de detalhe, **Then** o sistema retorna status 404
   com mensagem indicativa de que o podcast não foi encontrado.

---

### User Story 3 - Cadastrar um novo podcast (Priority: P1)

Um usuário autenticado com perfil de editor ou administrador cadastra um novo podcast
informando nome e URL do feed RSS. O sistema valida os dados, cria o podcast e dispara
a importação de episódios.

**Why this priority**: O cadastro é a operação de escrita fundamental que alimenta o
sistema com novos conteúdos. Sem ele, a base de podcasts não cresce.

**Independent Test**: Fazer uma requisição POST autenticada com nome e feed válidos e
verificar que o podcast é criado com status 201 e que a importação de episódios é
enfileirada.

**Acceptance Scenarios**:

1. **Given** que um usuário autenticado (editor ou admin) fornece um nome e feed válidos
   e únicos, **When** ele faz uma requisição POST para o endpoint de criação, **Then**
   o sistema retorna status 201 com o ID do podcast criado e indicador de sucesso.

2. **Given** que já existe um podcast com o mesmo nome ou feed, **When** o usuário faz
   uma requisição POST, **Then** o sistema retorna status 200 informando que o podcast
   já existe com seu respectivo ID, sem criar duplicata.

3. **Given** que o usuário fornece dados inválidos (nome vazio, feed malformado),
   **When** ele faz uma requisição POST, **Then** o sistema retorna status 400 com
   mensagem descritiva do erro de validação.

4. **Given** que um usuário não autenticado ou sem perfil de editor/admin tenta cadastrar,
   **When** ele faz uma requisição POST, **Then** o sistema retorna status 401 ou 403
   indicando que a autenticação/permissão é necessária.

---

### User Story 4 - Atualizar um podcast existente (Priority: P2)

Um usuário autenticado com perfil de editor ou administrador atualiza os dados de um
podcast existente (nome, imagem, idioma).

**Why this priority**: A atualização permite corrigir e manter os dados dos podcasts
atualizados, mas é menos frequente que as operações de leitura e cadastro.

**Independent Test**: Fazer uma requisição PUT ou PATCH autenticada para um podcast
existente e verificar que os dados são atualizados corretamente.

**Acceptance Scenarios**:

1. **Given** que um usuário autenticado (editor ou admin) deseja atualizar todos os
   campos de um podcast, **When** ele faz uma requisição PUT com os dados completos,
   **Then** o sistema retorna status 200 com os dados atualizados do podcast.

2. **Given** que um usuário autenticado deseja atualizar apenas um campo (ex: imagem),
   **When** ele faz uma requisição PATCH com o campo alterado, **Then** o sistema
   retorna status 200 com o podcast atualizado mantendo os demais campos inalterados.

3. **Given** que o podcast com o ID informado não existe, **When** o usuário faz uma
   requisição PUT ou PATCH, **Then** o sistema retorna status 404.

4. **Given** que um usuário não autenticado ou sem permissão tenta atualizar, **When**
   ele faz uma requisição PUT ou PATCH, **Then** o sistema retorna status 401 ou 403.

5. **Given** que o usuário atualiza o feed para uma nova URL válida, **When** a
   requisição é processada com sucesso, **Then** o sistema dispara uma re-importação
   completa dos episódios do novo feed, substituindo os episódios anteriores.

6. **Given** que o usuário tenta atualizar o feed para uma URL já usada por outro
   podcast, **When** a requisição é processada, **Then** o sistema retorna status 400
   com erro de validação de unicidade.

---

### User Story 5 - Remover um podcast (Priority: P2)

Um usuário autenticado com perfil de editor ou administrador remove um podcast do
sistema. A remoção também elimina os episódios associados.

**Why this priority**: A remoção é necessária para manutenção da base, mas é a operação
mais sensível e menos frequente do CRUD.

**Independent Test**: Fazer uma requisição DELETE autenticada para um podcast existente
e verificar que o podcast e seus episódios são removidos.

**Acceptance Scenarios**:

1. **Given** que um usuário autenticado (editor ou admin) deseja remover um podcast
   existente, **When** ele faz uma requisição DELETE, **Then** o sistema retorna
   status 204 (sem conteúdo) e o podcast e seus episódios são removidos do banco.

2. **Given** que o podcast com o ID informado não existe, **When** o usuário faz uma
   requisição DELETE, **Then** o sistema retorna status 404.

3. **Given** que um usuário não autenticado ou sem permissão tenta remover, **When**
   ele faz uma requisição DELETE, **Then** o sistema retorna status 401 ou 403.

---

### Edge Cases

- Como o sistema se comporta ao tentar criar um podcast com uma URL de feed inválida
  (não é uma URL real ou não aponta para um feed RSS/Atom válido)?
  → **Resolvido**: O formato da URL é validado sincronamente (deve ser URL válida).
  A validação do conteúdo RSS (se é um feed válido e parseável) ocorre de forma
  assíncrona via tarefa Celery após a criação do podcast. Se o feed for inválido,
  a tarefa falha silenciosamente e o podcast permanece cadastrado sem episódios.
- O que acontece com os episódios quando um podcast é removido?
  → Todos os episódios associados são removidos em cascata (comportamento padrão do
  CASCADE definido no modelo).
- Como o sistema responde quando a atualização do nome colide com um podcast existente?
  → O sistema retorna erro de validação de unicidade (campo `name` é `unique=True`).
- O que acontece quando a paginação é requisitada com número de página inexistente?
  → O sistema retorna a última página disponível ou resposta vazia, conforme padrão
  do DRF.
- O que acontece com os episódios antigos quando o feed é atualizado?
  → **Resolvido**: Os episódios do feed antigo são removidos e uma nova importação
  assíncrona é disparada para o novo feed. Durante a re-importação, o podcast pode
  temporariamente ter zero episódios.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE expor um endpoint de listagem de podcasts acessível via
  GET, com acesso público (sem autenticação), retornando dados paginados.
- **FR-002**: O sistema DEVE suportar busca por nome no endpoint de listagem através
  de parâmetro de query.
- **FR-003**: O sistema DEVE suportar filtro por idioma no endpoint de listagem.
- **FR-004**: O sistema DEVE expor um endpoint de detalhe de podcast acessível via GET
  com o ID do podcast, retornando todos os campos do podcast e seus episódios associados,
  com acesso público.
- **FR-005**: O sistema DEVE expor um endpoint de criação de podcast acessível via POST,
  restrito a usuários autenticados com perfil de editor ou administrador, aceitando nome
  e feed como campos obrigatórios.
- **FR-005a**: O sistema DEVE validar o formato da URL do feed sincronamente no endpoint
  de criação, rejeitando URLs malformadas com erro de validação. A validação do conteúdo
  RSS (se o feed é válido e parseável) DEVE ocorrer de forma assíncrona via tarefa
  enfileirada após a criação bem-sucedida.
- **FR-006**: O sistema DEVE validar unicidade de nome e feed no cadastro, retornando
  indicação de podcast existente quando aplicável.
- **FR-007**: O sistema DEVE disparar importação assíncrona de episódios ao cadastrar
  um novo podcast com sucesso.
- **FR-008**: O sistema DEVE expor um endpoint de atualização de podcast acessível via
  PUT (atualização completa) e PATCH (atualização parcial), restrito a usuários
  autenticados com perfil de editor ou administrador.
- **FR-008a**: O sistema DEVE disparar uma re-importação completa dos episódios quando
  o campo `feed` for atualizado, removendo os episódios do feed antigo e importando
  os do novo feed.
- **FR-009**: O sistema DEVE validar unicidade de nome e feed durante atualizações,
  impedindo conflito com outros podcasts existentes.
- **FR-010**: O sistema DEVE expor um endpoint de remoção de podcast acessível via
  DELETE, restrito a usuários autenticados com perfil de editor ou administrador,
  removendo o podcast e seus episódios em cascata.
- **FR-011**: O sistema DEVE retornar status 404 para operações de leitura, atualização
  e remoção quando o podcast com o ID informado não existir.
- **FR-012**: O sistema DEVE retornar status 401 ou 403 para operações de escrita
  (criação, atualização, remoção) quando o usuário não estiver autenticado ou não
  possuir perfil de editor/administrador.
- **FR-013**: O sistema DEVE retornar mensagens de erro de validação descritivas para
  dados inválidos em operações de criação e atualização.

### Key Entities *(include if feature involves data)*

- **Podcast**: Entidade principal do CRUD. Atributos: nome (único), feed URL (único),
  imagem, idioma (relacionamento com PodcastLanguage), total de episódios. Possui
  relacionamento 1:N com Episode.
- **PodcastLanguage**: Entidade de referência para idiomas. Atributos: código, nome.
  Relacionamento 1:N com Podcast.
- **Episode**: Entidade dependente. Relacionada ao Podcast via FK com CASCADE.
  Removida automaticamente quando o podcast é excluído.
- **Tag**: Entidade de categorização associada a episódios via M:N.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Usuários conseguem listar podcasts e receber resultados paginados em
  menos de 2 segundos.
- **SC-002**: Usuários autenticados conseguem criar um novo podcast e receber
  confirmação em menos de 3 segundos.
- **SC-003**: 100% dos endpoints de escrita (criação, atualização, remoção) rejeitam
  requisições sem autenticação válida.
- **SC-004**: Operações de atualização e remoção preservam a integridade referencial
  dos dados (sem podcasts órfãos, sem episódios sem podcast).
- **SC-005**: Todos os endpoints retornam respostas consistentes com códigos HTTP
  adequados (200, 201, 204, 400, 401, 403, 404) conforme o cenário.

## Assumptions

- O endpoint base segue o padrão existente: `/api/podcasts/` via DRF router.
- A paginação segue o padrão global do DRF configurado no projeto (PageNumberPagination).
- A autenticação utiliza o mecanismo já configurado no projeto (Token/Session auth do DRF).
- A permissão para escrita utiliza a classe `IsEditorOrAdmin` já existente no módulo
  `accounts.permissions`.
- A importação de episódios após criação é enfileirada via Celery (tarefa assíncrona
  existente em `PodcastService.create_podcast`).
- Os serializers existentes (`PodcastListSerializer`, `PodcastDetailSerializer`) serão
  reutilizados ou estendidos conforme necessário.
- A API não requer versionamento adicional (`/api/v1/`) nesta iteração, seguindo o
  padrão atual do projeto.
