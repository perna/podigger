# Perguntas para Validação — podigger

> Gerado pelo Revisor em 2026-06-06
> `doc_level` = `completo` → `questions.md` para todos os 🔴 detectados.
> `answer_mode` = `chat` → perguntas também apresentadas no chat.

**Perna**, encontrei **1 inconsistência direta** e **vários gaps/decições abertas** que precisam da sua validação antes de fechar a Fase 5.

---

## Pergunta 1 — Inconsistência: `accounts/tasks.md` T-19 sobre JWT rotation

**Contexto:** A spec `_reversa_sdd/accounts/tasks.md` linha 142 (Tarefa T-19) afirma:

> `ROTATE_REFRESH_TOKENS = False; BLACKLIST_AFTER_ROTATION = False`

Mas o **código real** em `backend/config/settings.py:207-208` tem:

```python
"ROTATE_REFRESH_TOKENS": True,
"BLACKLIST_AFTER_ROTATION": True,
```

E todas as outras specs estão alinhadas com o código:
- `config/requirements.md` R-CFG-15 = `True/True` (🟢)
- `config/design.md:157` = `True/True` (🟢)
- `config/tasks.md:115` (T-17) = `True/True` (🟢)
- `permissions.md:263` confirma rotação habilitada (🟢)
- ADR-002 também referencia

**Spec afetada:** [`_reversa_sdd/accounts/tasks.md` (T-19, linha 142)]

**Pergunta:** A spec `accounts/tasks.md` T-19 está errada. Posso corrigi-la para refletir o código real (`True/True`)?

**Impacto:** Sem correção, a spec da unit `accounts` induz a erro na reimplementação. Após correção, o critério de pronto de T-19 fica `ROTATE_REFRESH_TOKENS is True, BLACKLIST_AFTER_ROTATION is True`, alinhado com o resto.

**Resposta:** <!-- preencha aqui -->

---

## Pergunta 2 — Auditoria de aprovação de usuários (R-USER-08)

**Contexto:** `UserApproveView.post` (`backend/accounts/views.py:223-236`) altera `approval_status` sem registrar **quem** aprovou e **quando** separadamente do `updated_at`. Mesmo coisa para `UserRoleUpdateView.patch` (mudança de role).

Spec já tem tarefas rascunhadas (T-AUDIT-01 a T-AUDIT-04 em `accounts/tasks.md`) e a spec `permissions.md:243` confirma que você disse "deveria ter log".

**Spec afetada:** [`_reversa_sdd/accounts/requirements.md`], [`_reversa_sdd/accounts/design.md`], [`_reversa_sdd/state-machines.md`]

**Pergunta:** A auditoria de aprovação/mudança de role é um requisito de produto (deve ser implementado) ou apenas uma observação de hardening (pode ficar como gap conhecido)?

**Impacto:**
- Se **requisito**: criar `UserApprovalLog` model + signal + endpoint admin para listar logs. Reclassifico R-USER-08 de 🔴→🟢.
- Se **gap aceitável**: mantenho como 🔴 no relatório final. Tarefas rascunhadas ficam como "T-futuro".

**Resposta:** <!-- preencha aqui -->

---

## Pergunta 3 — Invalidação JWT no logout (AI-5)

**Contexto:** O `POST /api/auth/logout` (em `frontend/src/app/api/auth/logout/route.ts:3-18`) apenas limpa os cookies. O token JWT **permanece válido no backend** até o `exp` (access 5min, refresh 24h). A app `rest_framework_simplejwt.token_blacklist` já está instalada e o `SIMPLE_JWT.BLACKLIST_AFTER_ROTATION = True` indica que a infraestrutura está pronta.

**Spec afetada:** [`_reversa_sdd/accounts/requirements.md`], [`_reversa_sdd/permissions.md`]

**Pergunta:** O logout deve invalidar o JWT no backend (chamar `/api/auth/token/blacklist/`) ou manter a abordagem atual (apenas limpar cookies)?

**Impacto:**
- Se **sim**: implementar T-BLACKLIST-01 a T-BLACKLIST-04 (de `accounts/tasks.md`). Reclassifico AI-5 de 🔴→🟢.
- Se **não**: mantenho AI-5 como 🔴. Trade-off documentado: token roubado é válido até `exp` (até 24h para refresh).

**Resposta:** <!-- preencha aqui -->

---

## Pergunta 4 — Rate limit dedicado em busca de episódios (AI-4)

**Contexto:** `EpisodeViewSet` (em `backend/podcasts/views.py`) não tem throttle scope dedicado. O throttle global `anon: 100/min` é compartilhado com todas as rotas anônimas, então um usuário pode fazer 100 buscas/minuto e inflar o `PopularTerm` (`update_or_create`). A `config/tasks.md` menciona que escopo `search` deveria existir.

**Spec afetada:** [`_reversa_sdd/podcasts/requirements.md`], [`_reversa_sdd/permissions.md`]

**Pergunta:** A busca de episódios deve ter um throttle dedicado (mais restritivo que o `anon: 100/min` global)?

**Impacto:**
- Se **sim**: adicionar `throttle_scope = "search"` (ex: `20/min` para anônimo, `60/min` para usuário) em `EpisodeViewSet`. Reclassifico AI-4 de 🔴→🟢.
- Se **não**: manter 100/min global. Documento o trade-off.

**Resposta:** <!-- preencha aqui -->

---

## Pergunta 5 — AuthContext: persistência após reload (R-FF-45)

**Contexto:** `AuthContext` armazena `user` apenas em memória (`useState`). No reload da página, `user` volta a `null` (porque cookies são HttpOnly e o frontend não pode lê-los). A navbar mostra "Login" mesmo o usuário estando autenticado. Único sinal: cookie `access_token` é checado pelo middleware para `/add-podcast` e `/admin/*`.

Possíveis soluções:
- (a) Criar `GET /api/auth/me/` no backend, e `AuthProvider` fazer fetch on mount
- (b) Cookie client-readable (não-HttpOnly) com `{email, role}` — mas perde proteção XSS
- (c) Aceitar drift atual: usuário aparece "deslogado" na navbar até próxima ação

**Spec afetada:** [`_reversa_sdd/frontend-features/requirements.md`], [`_reversa_sdd/frontend-features/tasks.md` (T-53)]

**Pergunta:** Como você quer resolver o "drift" do AuthContext após reload?

**Impacto:** Define uma das 3 opções acima. Reclassifico R-FF-45 de 🟡→🟢 (com solução) ou 🟡→🔴 (manter gap).

**Resposta:** <!-- preencha aqui -->

---

## Pergunta 6 — i18n: idioma oficial do produto (R-FF-55)

**Contexto:** A UI mostra `No results found` (EN) mas `Sua conta aguarda aprovação` (PT-BR). O backend tem `<html lang="en">` no `layout.tsx` (bug R-PAGE-20) e `LANGUAGE_CODE = "en-us"` no Django settings. O usuário final vê mix.

**Spec afetada:** [`_reversa_sdd/frontend-features/tasks.md` (T-50, T-47)], [`_reversa_sdd/config/requirements.md`]

**Pergunta:** Qual é o idioma oficial do produto?
- (a) **PT-BR total** — traduzir todos os textos de UI (atualmente alguns estão em EN) + mudar `<html lang>` para `pt-BR`
- (b) **EN total** — manter backend PT-BR nas mensagens técnicas internas, mas mudar UI para EN
- (c) **Bilingue** — adicionar i18n real (next-intl) e escolher idioma por feature flag / browser

**Impacto:** Define se T-47 (anti-FOUC) e T-50 (tradução EN→PT-BR) viram requisitos ou melhorias. Hoje ambos são 🟡.

**Resposta:** <!-- preencha aqui -->

---

## Pergunta 7 — `addPodcast` sem proxy (R-FF-54)

**Contexto:** `frontend/src/lib/api.ts:90-108` faz `POST ${API_BASE}/api/podcasts/` **direto** para o backend, sem passar pelo proxy `/api/proxy/podcasts/`. O proxy tem auto-refresh transparente de JWT; sem ele, se o `access_token` expirar entre o mount da página e o click, o usuário recebe 401 sem retry.

**Spec afetada:** [`_reversa_sdd/frontend-features/contracts.md`], [`_reversa_sdd/frontend-features/tasks.md` (T-48)]

**Pergunta:** Refatorar `addPodcast` para usar `/api/proxy/podcasts/` (mesmo padrão dos outros endpoints) ou manter POST direto?

**Impacto:**
- Se **refatorar**: implementar T-48. Reclassifico R-FF-54 de 🔴→🟢.
- Se **manter**: documentar a limitação conhecida; usuário pode receber 401 raro.

**Resposta:** <!-- preencha aqui -->

---

## Pergunta 8 — SearchHeader: código morto (T-51)

**Contexto:** `frontend/src/components/home/SearchHeader.tsx` (93 LOC + 71 LOC de teste) **não é importado** em runtime por nenhuma página. É candidato a remoção.

**Spec afetada:** [`_reversa_sdd/frontend-features/tasks.md` (T-51)]

**Pergunta:** O que fazer com o `SearchHeader`?

**Impacto:**
- (a) **Deletar** o arquivo + teste (cleanup)
- (b) **Migrar** para ser o header mobile (hoje `SearchHero` cobre desktop; mobile só tem `BottomNav` minimalista)
- (c) **Documentar** como dead code (manter arquivo, mas adicionar comentário `// DEAD CODE — não importar`)

**Resposta:** <!-- preencha aqui -->

---

## Pergunta 9 — Gaps de UI sem consumer (popular-terms, recent, podcasts/[id])

**Contexto:** 3 endpoints do backend não têm consumer no frontend:
- `GET /api/popular-terms/` (PopularTermViewSet) — sidebar mostra "Trending Podcasts — Coming soon..."
- `GET /api/podcasts/recent/` (custom action) — não consumido; HomeClient usa `?search=...` em vez de recent
- `GET /api/podcasts/{id}/` (retrieve) — `PodcastCard` linka para `/podcasts/{id}` que é 404 (rota não implementada)

**Spec afetada:** [`_reversa_sdd/traceability/code-spec-matrix.md` (Gaps 3, 5, 6)], [`_reversa_sdd/frontend-features/requirements.md`]

**Pergunta:** Esses 3 endpoints devem ganhar UI agora (próxima feature) ou são roadmap futuro?

**Impacto:**
- Se **agora**: criar tarefas para `TrendingPodcasts` (sidebar) + `RecentPodcasts` (sidebar) + `PodcastDetailPage` (`/podcasts/[id]`)
- Se **futuro**: manter como gap 🔴 documentado, sem tarefa registrada

**Resposta:** <!-- preencha aqui -->

---

## Pergunta 10 — `formatRelativeTime` extração (R-FF-56)

**Contexto:** `EpisodeCardCompact` define `formatRelativeTime` **inline** (helper local). Se outro componente precisar (ex: novo `RecentPodcasts`), vai duplicar a lógica.

**Spec afetada:** [`_reversa_sdd/frontend-features/tasks.md` (T-37)]

**Pergunta:** Extrair `formatRelativeTime` para `frontend/src/lib/utils.ts` agora ou quando aparecer o segundo consumer?

**Impacto:**
- Se **agora**: implementar T-37. Reclassifico R-FF-56 de 🟡→🟢.
- Se **depois**: manter como 🟡. Aceitar duplicação temporária.

**Resposta:** <!-- preencha aqui -->

---

## Resumo

| # | Tema | Tipo | Status atual |
|---|------|------|--------------|
| 1 | JWT settings em accounts/tasks.md | Inconsistência direta | 🟡 → corrigir |
| 2 | R-USER-08 (auditoria) | Decisão de produto | 🔴 |
| 3 | AI-5 (blacklist no logout) | Decisão de produto | 🔴 |
| 4 | AI-4 (rate limit busca) | Decisão de produto | 🔴 |
| 5 | R-FF-45 (AuthContext persist) | Decisão técnica | 🟡 |
| 6 | R-FF-55 / R-PAGE-20 (i18n + html lang) | Decisão de produto | 🟡 / 🟡 |
| 7 | R-FF-54 (addPodcast proxy) | Decisão técnica | 🔴 |
| 8 | T-51 (SearchHeader dead code) | Decisão de housekeeping | 🟢 |
| 9 | Gaps de UI (popular-terms, recent, podcasts/[id]) | Roadmap | 🔴 |
| 10 | R-FF-56 (formatRelativeTime extração) | Decisão técnica | 🟡 |

**Total de perguntas:** 10 (1 inconsistência + 4 gaps 🔴 abertos + 5 melhorias 🟡 com decisão pendente)

> Responda no chat ou preencha o campo `**Resposta:**` de cada pergunta. Quando terminar, digite `reversi` ou "terminei" para eu processar.
