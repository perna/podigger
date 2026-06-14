# Feature Specification: Página de Busca de Podcasts

**Feature Branch**: `001-podcast-search-page`

**Created**: 2026-06-12

**Status**: Draft

**Input**: User description: "nova feature, página de busca de podcasts"

## Clarifications

### Session 2026-06-12

- Q: Qual deve ser a rota da página de busca? → A: `/search` (em inglês)
- Q: O que acontece quando o usuário digita um termo muito curto (1 caractere)? → A: Mínimo de 2 caracteres; frontend impede submit com termo < 2 caracteres
- Q: Qual o esquema de parâmetros da URL para abas de filtro e paginação? → A: `?q=`, `?tab=`, `?page=` — page unificado que reseta ao trocar aba
- Q: Qual o tamanho de página (itens por página) para paginação? → A: Fixo em 10 itens por página, consistente com o backend
- Q: Quantos termos populares devem ser exibidos? → A: Até 8 termos, ordenados por frequência de busca
- Q: Estratégia para submissão rápida repetida de busca? → A: Abortar requisição anterior via AbortController ao submeter nova busca

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Buscar podcasts e episódios por termo (Priority: P1)

Um usuário acessa a página de busca, digita um termo no campo de busca e o sistema
retorna uma lista de podcasts e episódios relevantes para aquele termo, agrupados por
tipo de resultado.

**Why this priority**: É a funcionalidade central do Podigger como motor de busca de
podcasts. Sem busca, o produto não entrega seu valor principal.

**Independent Test**: Pode ser testado acessando a página `/search`,
digitando um termo e verificando que podcasts e episódios relevantes aparecem na tela.

**Acceptance Scenarios**:

1. **Given** que o usuário está na página de busca com o campo vazio, **When** ele digita
   "tecnologia" e submete a busca, **Then** o sistema exibe uma lista de podcasts cujo
   nome contém "tecnologia" e episódios cujo título ou descrição contêm "tecnologia",
   agrupados por tipo (podcasts primeiro, episódios depois).

2. **Given** que o usuário está na página de busca, **When** ele busca por um termo que
   não existe em nenhum podcast ou episódio, **Then** o sistema exibe uma mensagem
   informando que nenhum resultado foi encontrado para aquele termo.

3. **Given** que o usuário submete uma busca com o campo vazio, **When** a busca é
   executada, **Then** o sistema retorna os episódios mais recentes como sugestão
   inicial, sem aplicar filtro de termo.

---

### User Story 2 - Filtrar resultados por tipo (Priority: P2)

Após realizar uma busca, o usuário pode alternar entre visualizar todos os resultados,
apenas podcasts, ou apenas episódios, através de abas de filtro.

**Why this priority**: Refina a experiência de busca permitindo que o usuário navegue
por categorias de resultado, mas depende da busca básica (US1) estar funcional.

**Independent Test**: Após buscar por "python", clicar na aba "Podcasts" exibe apenas
podcasts; clicar em "Episódios" exibe apenas episódios; "Todos" mostra ambos.

**Acceptance Scenarios**:

1. **Given** que o usuário realizou uma busca por "python" e vê resultados mistos,
   **When** ele clica na aba "Episódios", **Then** apenas episódios são exibidos.

2. **Given** que o usuário está na aba "Podcasts" após uma busca, **When** ele clica
   na aba "Todos", **Then** tanto podcasts quanto episódios são exibidos novamente.

3. **Given** que o usuário muda de aba com uma busca ativa, **When** a nova aba não
   possui resultados (ex: busca por "python" na aba "Podcasts" sem podcasts com esse
   nome), **Then** o sistema exibe mensagem específica: "Nenhum podcast encontrado
   para 'python'".

---

### User Story 3 - Navegar por páginas de resultados (Priority: P3)

Quando uma busca retorna muitos resultados, o usuário pode navegar entre páginas para
explorar todos os resultados encontrados.

**Why this priority**: Essencial para usabilidade com grandes volumes de dados, mas a
experiência central de busca funciona sem paginação para poucos resultados.

**Independent Test**: Buscar por um termo comum que retorne mais de 10 episódios e
verificar que controles de paginação aparecem e permitem navegar para a próxima página.

**Acceptance Scenarios**:

1. **Given** que uma busca retornou mais de 10 episódios, **When** os resultados são
   exibidos, **Then** controles de paginação aparecem no final da lista permitindo
   avançar e retroceder páginas.

2. **Given** que o usuário está na página 2 de resultados, **When** ele muda a aba de
   filtro (ex: de "Todos" para "Podcasts"), **Then** a paginação é resetada para a
   página 1 da nova aba.

3. **Given** que o usuário navega entre páginas, **When** os resultados da nova página
   carregam, **Then** a página rola suavemente de volta ao topo dos resultados.

---

### User Story 4 - Ver termos populares como sugestão (Priority: P3)

Ao acessar a página de busca sem ter digitado nada, o usuário vê uma lista de termos
populares que pode clicar para buscar rapidamente.

**Why this priority**: Funcionalidade complementar que acelera a descoberta de conteúdo,
mas não bloqueia o uso principal da busca.

**Independent Test**: Acessar a página de busca e verificar que termos como "tecnologia",
"python", "design" (ou os termos mais buscados) aparecem como chips clicáveis. Clicar em
um termo executa a busca automaticamente.

**Acceptance Scenarios**:

1. **Given** que o usuário acessa a página de busca pela primeira vez, **When** a página
   carrega com o campo de busca vazio, **Then** uma seção de "Termos populares" aparece
   com chips contendo os termos mais buscados.

2. **Given** que os termos populares estão visíveis, **When** o usuário clica em um chip
   "tecnologia", **Then** o campo de busca é preenchido com "tecnologia" e a busca é
   executada automaticamente.

3. **Given** que não há dados de termos populares (sistema novo ou sem buscas anteriores),
   **When** a página carrega, **Then** a seção de termos populares não é exibida, evitando
   uma área vazia.

---

### Edge Cases

- O que acontece quando o usuário digita um termo muito curto (1 caractere)?
  → **Resolvido**: O frontend valida comprimento mínimo de 2 caracteres antes de submeter a busca. Termos com 1 caractere não disparam chamada à API; o botão de busca permanece desabilitado.
- Como o sistema lida com caracteres especiais e acentos no termo de busca?
- O que acontece quando a busca é submetida repetidamente em rápida sucessão (usuário
  impaciente)?
  → **Resolvido**: Requisições anteriores em andamento são abortadas via AbortController ao
  submeter nova busca. Apenas o resultado da requisição mais recente é renderizado.
- Como o sistema se comporta quando o backend está indisponível (erro de rede)?
- O que acontece quando o usuário navega para a página de busca com um termo já
  preenchido via URL (ex: `/search?q=python`)?
- Como o sistema responde quando o usuário pressiona Enter no campo de busca?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE exibir uma página de busca acessível pela rota `/search`
  com um campo de texto para entrada do termo de busca.
- **FR-001a**: O sistema DEVE validar que o termo de busca possui no mínimo 2 caracteres
  antes de submeter a consulta; o botão de busca DEVE permanecer desabilitado para termos
  com menos de 2 caracteres.
- **FR-002**: O sistema DEVE buscar simultaneamente podcasts (por nome) e episódios (por
  título e descrição) quando o usuário submete um termo.
- **FR-002a**: O sistema DEVE abortar requisições de busca em andamento (via
  AbortController) quando uma nova busca é submetida, garantindo que apenas o resultado
  da requisição mais recente seja exibido.
- **FR-003**: O sistema DEVE exibir os resultados agrupados por tipo (podcasts e
  episódios) ou unificados, com indicador visual do tipo de cada resultado.
- **FR-004**: O sistema DEVE permitir filtrar resultados por tipo através de abas:
  "Todos", "Podcasts" e "Episódios".
- **FR-005**: O sistema DEVE exibir paginação quando houver mais de 10 resultados de um
  mesmo tipo. Cada página DEVE conter exatamente 10 itens (page_size=10).
- **FR-006**: O sistema DEVE carregar e exibir até 8 termos populares como chips
  clicáveis quando o campo de busca estiver vazio, ordenados por frequência de busca
  decrescente.
- **FR-007**: O sistema DEVE registrar cada termo de busca submetido para alimentar a
  lista de termos populares (via API existente de PopularTerm).
- **FR-008**: O sistema DEVE exibir mensagem informativa quando uma busca não retornar
  resultados, com o termo buscado visível na mensagem.
- **FR-009**: O sistema DEVE exibir um indicador de carregamento enquanto a busca está
  em andamento.
- **FR-010**: O sistema DEVE preservar o termo de busca e o estado da interface na URL
  (`/search?q=<termo>&tab=<todos|podcasts|episodios>&page=<n>`) permitindo
  compartilhamento e navegação direta. Ao trocar de aba, o parâmetro `page` DEVE resetar
  para 1.
- **FR-011**: O sistema DEVE responder ao pressionamento da tecla Enter no campo de
  busca executando a pesquisa.
- **FR-012**: O sistema DEVE lidar com erros de rede exibindo uma mensagem amigável e
  opção de tentar novamente.

### Key Entities *(include if feature involves data)*

- **Termo de Busca (Search Term)**: String digitada pelo usuário, armazenada como
  `PopularTerm` para analytics. Já existe no sistema.
- **Resultado de Podcast**: Dados de um podcast que corresponde ao termo buscado: nome,
  imagem, total de episódios, link para página de detalhes.
- **Resultado de Episódio**: Dados de um episódio que corresponde ao termo buscado:
  título, descrição (trecho), data de publicação, podcast ao qual pertence, link para
  o episódio.
- **Termo Popular (Popular Term)**: Termo frequentemente buscado, com contagem de vezes
  que foi pesquisado. Já existe no sistema como modelo `PopularTerm`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Usuários conseguem realizar uma busca e visualizar resultados em menos de
  3 segundos em condições normais de rede.
- **SC-002**: 90% das buscas retornam resultados relevantes na primeira página (o termo
  buscado aparece no título ou descrição dos itens retornados).
- **SC-003**: Usuários conseguem alternar entre abas de filtro (Todos/Podcasts/Episódios)
  em menos de 1 segundo após os resultados estarem carregados.
- **SC-004**: A página de busca é acessível diretamente via URL com termo de busca
  (ex: `/search?q=tecnologia&tab=todos`) e exibe resultados sem interação adicional do usuário.

## Assumptions

- O backend já possui endpoints de busca: `/api/episodes/?q=termo` para busca
  full-text em episódios e `/api/podcasts/?search=termo` para busca por nome de
  podcast.
- O backend já possui o modelo `PopularTerm` e endpoint `/api/popular-terms/` para
  consulta de termos populares.
- O backend já registra automaticamente termos buscados via `PopularTerm` quando a
  API de episódios é consultada com parâmetro `q`.
- O frontend já possui componente `SearchHero` com campo de busca e botão, que pode
  ser reutilizado ou adaptado.
- A interface será em português brasileiro, seguindo o padrão existente do projeto.
- O design deve seguir o sistema de design existente (Tailwind CSS, componentes de UI
  em `src/components/ui/`).
- Usuários não precisam de autenticação para buscar (acesso público), consistente com
  as permissões `AllowAny` já configuradas nos endpoints de leitura.
- A página de busca será uma nova rota no App Router do Next.js, em `/search`.
