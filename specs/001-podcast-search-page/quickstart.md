# Quickstart: Página de Busca de Podcasts

Validation guide for end-to-end testing of the search page feature.

## Prerequisites

1. Backend running (Django dev server or Docker):
   ```bash
   make services    # Start PostgreSQL + Redis
   make migrate     # Apply migrations
   make seed        # Seed database with sample podcasts/episodes
   make dev         # Start Django on :8000
   ```

2. Frontend running:
   ```bash
   make frontend-dev   # Start Next.js on :5173
   ```

3. Confirme que os endpoints de busca retornam dados:
   ```bash
   curl -s "http://localhost:8000/api/episodes/?q=python" | head -c 200
   curl -s "http://localhost:8000/api/podcasts/?search=python" | head -c 200
   curl -s "http://localhost:8000/api/popular-terms/" | head -c 200
   ```

## Validation Scenarios

### VS-1: Busca básica (User Story 1)

1. Acesse `http://localhost:5173/search`
2. Digite um termo conhecido (ex: `python`) no campo de busca
3. Pressione **Enter** ou clique em **Buscar**
4. ✅ Resultados de podcasts (se houver) e episódios aparecem agrupados
5. ✅ A URL muda para `/search?q=python`

### VS-2: Busca sem resultados (User Story 1, cenário 2)

1. Na página `/search`, digite um termo sem correspondência: `xyznaoexiste123`
2. Submeta a busca
3. ✅ Mensagem "Nenhum resultado encontrado para 'xyznaoexiste123'" é exibida

### VS-3: Campo vazio mostra recentes (User Story 1, cenário 3)

1. Acesse `/search` com o campo vazio
2. Submeta a busca (ou acesse diretamente `/search?q=`)
3. ✅ Episódios recentes são exibidos (sem filtro de termo)

### VS-4: Filtro por abas (User Story 2)

1. Busque por `python` em `/search`
2. Clique na aba **Episódios**
3. ✅ Apenas episódios são exibidos (nenhum podcast aparece)
4. Clique na aba **Podcasts**
5. ✅ Apenas podcasts são exibidos
6. Clique na aba **Todos**
7. ✅ Ambos os tipos reaparecem sem chamada adicional à API

### VS-5: Aba sem resultados (User Story 2, cenário 3)

1. Busque por um termo que só existe em episódios, não em nome de podcast
2. Clique na aba **Podcasts**
3. ✅ Mensagem "Nenhum podcast encontrado para '[termo]'" é exibida

### VS-6: Paginação (User Story 3)

1. Busque por um termo que retorna muitos resultados (verifique que `count > 10` no JSON)
2. ✅ Controles de paginação aparecem ao final da lista
3. Clique em **Próxima** (página 2)
4. ✅ URL atualiza para `/search?q=...&page=2`
5. ✅ Novos resultados são carregados
6. ✅ Botão **Anterior** aparece para voltar à página 1

### VS-7: Paginação reseta ao trocar aba (User Story 3, cenário 2)

1. Busque e navegue até página 2 de episódios
2. Mude para a aba **Podcasts**
3. ✅ Paginação reseta para página 1 da nova aba

### VS-8: Termos populares (User Story 4)

1. Acesse `/search` (campo de busca vazio, sem `?q=` na URL)
2. ✅ Se houver dados, chips de termos populares aparecem (ex: "tecnologia", "python")
3. Clique em um chip
4. ✅ O campo de busca é preenchido e a busca é executada automaticamente

### VS-9: URL direta com termo (FR-010)

1. Acesse diretamente `http://localhost:5173/search?q=python`
2. ✅ A busca é executada automaticamente ao carregar a página
3. ✅ O campo de busca aparece preenchido com "python"

### VS-10: Indicador de carregamento (FR-009)

1. Busque por um termo
2. ✅ Um spinner/indicador de carregamento aparece enquanto a busca está em andamento
3. ✅ O indicador desaparece quando os resultados chegam

### VS-11: Erro de rede (FR-012)

1. Pare o backend (`Ctrl+C` no terminal do `make dev`)
2. Tente uma busca na página `/search`
3. ✅ Mensagem de erro amigável aparece com opção "Tentar novamente"
4. Reinicie o backend e clique em "Tentar novamente"
5. ✅ A busca é reexecutada com sucesso

## Test Commands

```bash
# Backend tests (existing — no new backend code)
make test

# Frontend tests (inclui novo componente de busca)
cd frontend && npm test
```

## Expected File Changes

| File | Change |
|------|--------|
| `frontend/src/app/search/page.tsx` | NEW: server component |
| `frontend/src/app/search/SearchPageClient.tsx` | NEW: client component |
| `frontend/src/components/search/FilterTabs.tsx` | NEW |
| `frontend/src/components/search/PodcastResults.tsx` | NEW |
| `frontend/src/components/search/EpisodeResults.tsx` | NEW |
| `frontend/src/components/search/PopularTerms.tsx` | NEW |
| `frontend/src/components/search/SearchPagination.tsx` | NEW |
| `frontend/src/components/search/SearchInput.tsx` | NEW: input with min-2-char validation + Enter |
| `frontend/src/lib/api.ts` | MODIFIED: add `fetchPopularTerms()` |
| `frontend/tests/app/search/SearchPageClient.test.tsx` | NEW |
