# Feature Specification: Listagem de Podcasts

**Feature Branch**: `001-podcast-listing`

**Created**: 2026-06-11

**Status**: Draft

**Input**: User description: "criar feature de listagem de podcasts. a feature de episódios será feita em outro momento. especifique backend e frontend"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Explorar todos os podcasts disponíveis (Priority: P1)

Um visitante (não autenticado) ou usuário autenticado acessa a página de listagem de podcasts e visualiza todos os podcasts cadastrados na plataforma, apresentados de forma paginada para facilitar a navegação em grandes volumes de dados.

**Why this priority**: É a funcionalidade central da feature — sem a listagem, nenhuma outra interação com podcasts é possível. Permite que usuários descubram o catálogo de podcasts disponíveis.

**Independent Test**: Pode ser testado acessando a rota `/podcasts` e verificando se a lista de podcasts é exibida com cards contendo nome, imagem, idioma e contagem de episódios.

**Acceptance Scenarios**:

1. **Given** que existem podcasts cadastrados no sistema, **When** o usuário acessa a página de listagem de podcasts, **Then** os podcasts são exibidos em cards com nome, imagem de capa, idioma e total de episódios
2. **Given** que existem mais de 20 podcasts cadastrados, **When** o usuário acessa a página de listagem, **Then** apenas os primeiros 20 são exibidos e um controle de paginação aparece ao final da lista
3. **Given** que não há podcasts cadastrados, **When** o usuário acessa a página de listagem, **Then** uma mensagem informativa "Nenhum podcast encontrado" é exibida

---

### User Story 2 - Buscar podcasts por nome (Priority: P1)

Um usuário utiliza o campo de busca na página de listagem para filtrar podcasts pelo nome, permitindo encontrar rapidamente um podcast específico sem precisar navegar por todas as páginas.

**Why this priority**: Busca é essencial para usabilidade quando o catálogo cresce. Sem busca, a descoberta de podcasts fica comprometida.

**Independent Test**: Pode ser testado digitando um termo no campo de busca e verificando se apenas podcasts cujo nome contém o termo são exibidos.

**Acceptance Scenarios**:

1. **Given** que existem podcasts "Nerdcast" e "DevCast" cadastrados, **When** o usuário digita "nerd" no campo de busca, **Then** apenas "Nerdcast" é exibido na listagem
2. **Given** que o usuário realizou uma busca com resultados, **When** o usuário limpa o campo de busca, **Then** a listagem completa de podcasts é restaurada
3. **Given** que o usuário realiza uma busca que não encontra correspondência, **When** a busca é concluída, **Then** a mensagem "Nenhum podcast encontrado para [termo buscado]" é exibida

---

### User Story 3 - Navegar entre páginas da listagem (Priority: P2)

Um usuário navega por múltiplas páginas de resultados usando controles de paginação (anterior/próximo ou numeração de páginas), permitindo explorar todo o catálogo de forma ordenada.

**Why this priority**: A paginação é necessária para boa performance e usabilidade com catálogos grandes, mas é um refinamento sobre a listagem básica.

**Independent Test**: Pode ser testado verificando se os controles de navegação entre páginas funcionam corretamente e se os dados exibidos correspondem à página selecionada.

**Acceptance Scenarios**:

1. **Given** que existem mais de 20 podcasts e o usuário está na primeira página, **When** o usuário clica em "Próxima", **Then** a segunda página de resultados é exibida
2. **Given** que o usuário está em uma página intermediária, **When** o usuário clica em "Anterior", **Then** a página anterior é exibida
3. **Given** que o usuário está na última página, **When** a página é exibida, **Then** o botão "Próxima" aparece desabilitado

---

### User Story 4 - Filtrar podcasts por idioma (Priority: P3)

Um usuário filtra a listagem de podcasts por idioma (ex.: português, inglês, espanhol), reduzindo os resultados ao idioma de seu interesse.

**Why this priority**: Filtro por idioma agrega valor para usuários multilíngues, mas a listagem com busca já entrega valor suficiente para o MVP.

**Independent Test**: Pode ser testado selecionando um idioma no filtro e verificando se apenas podcasts daquele idioma são exibidos.

**Acceptance Scenarios**:

1. **Given** que existem podcasts em português e inglês, **When** o usuário seleciona o filtro "Português", **Then** apenas podcasts em português são exibidos
2. **Given** que o usuário aplicou um filtro de idioma, **When** o usuário remove o filtro, **Then** a listagem completa é restaurada

---

### Edge Cases

- O que acontece quando um podcast não possui imagem de capa? O sistema deve exibir uma imagem placeholder padrão.
- O que acontece quando a API de listagem retorna erro (timeout, 500)? O frontend deve exibir mensagem de erro amigável com opção de tentar novamente.
- Como o sistema se comporta com paginação quando há exatamente 20 podcasts (limite da página)? O botão "Próxima" não deve aparecer ou deve estar desabilitado.
- O que acontece quando o parâmetro de página é inválido (negativo, zero, maior que o total)? A API deve retornar a primeira página ou uma resposta vazia.
- Como o frontend lida com lentidão da rede durante a busca? Deve exibir indicador de carregamento (skeleton ou spinner) durante requisições.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O backend DEVE fornecer endpoint de listagem de podcasts com suporte a paginação (parâmetros `page` e `page_size`)
- **FR-002**: O backend DEVE fornecer filtro de busca textual por nome do podcast via parâmetro `search`
- **FR-003**: O backend DEVE fornecer filtro por idioma via parâmetro `language` (aceitando identificador do idioma)
- **FR-004**: O backend DEVE retornar metadados de paginação na resposta (total de itens, página atual, indicadores próximo/anterior)
- **FR-005**: O frontend DEVE exibir uma página dedicada à listagem de podcasts acessível via rota `/podcasts`
- **FR-006**: O frontend DEVE renderizar cada podcast como um card contendo: nome, imagem de capa (ou placeholder), idioma e total de episódios
- **FR-007**: O frontend DEVE incluir campo de busca textual que filtra podcasts em tempo real (com debounce) na página de listagem
- **FR-008**: O frontend DEVE implementar paginação com controles de navegação (anterior/próximo) na listagem
- **FR-009**: O frontend DEVE oferecer filtro por idioma como dropdown ou chips selecionáveis
- **FR-010**: O frontend DEVE exibir indicador de carregamento (skeleton/spinner) durante requisições à API
- **FR-011**: O frontend DEVE exibir mensagens de estado vazio quando não houver podcasts ou resultados de busca
- **FR-012**: O frontend DEVE exibir mensagem de erro com opção de retry quando a API falhar
- **FR-013**: A listagem de podcasts DEVE ser acessível para usuários não autenticados (acesso público)

### Key Entities

- **Podcast**: Representa um podcast no catálogo. Atributos relevantes para listagem: nome, URL da imagem de capa, idioma, total de episódios, data de criação. Já existe no sistema (`backend/podcasts/models.py`).
- **PodcastLanguage**: Representa um idioma disponível para classificação de podcasts. Atributos: código (ex.: "pt", "en") e nome (ex.: "Português"). Já existe no sistema.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A página de listagem de podcasts carrega e exibe os primeiros 20 resultados em até 3 segundos em conexão de banda larga padrão *(métrica de resultado pós-implantação; validada pelos cenários de carregamento do quickstart.md)*
- **SC-002**: O usuário consegue encontrar um podcast específico por nome em até 10 segundos utilizando a busca *(métrica de resultado pós-implantação; validada pelos cenários de busca do quickstart.md)*
- **SC-003**: A troca entre páginas da listagem ocorre em até 2 segundos *(métrica de resultado pós-implantação; validada pelos cenários de paginação do quickstart.md)*
- **SC-004**: 100% dos cenários de borda definidos (erro de API, lista vazia, podcast sem imagem) são tratados adequadamente sem quebras de interface
- **SC-005**: A listagem de podcasts é funcionalmente completa sem exigir que o usuário esteja autenticado

## Assumptions

- A API REST de podcasts (`/api/podcasts/`) já existe com suporte básico a listagem e busca; esta feature foca em garantir paginação completa, filtro por idioma, e na construção da interface de listagem no frontend
- O modelo `Podcast` e `PodcastLanguage` já existem e não serão alterados estruturalmente
- A feature de episódios (detalhe de podcast, listagem de episódios, página de episódio) será tratada em especificação separada e está fora do escopo desta feature
- A autenticação via JWT em cookies e o proxy de API (`/api/proxy/`) já estão implementados e serão reutilizados
- O design visual seguirá o tema escuro iOS-like já estabelecido no projeto (Tailwind CSS)
- O idioma padrão do filtro será determinado pela lista de idiomas já cadastrados no banco (`PodcastLanguage`)
- A paginação usará page_size padrão de 20 itens, configurável via query parameter
- O componente `PodcastCard` existente será estendido/adaptado para uso na página de listagem
