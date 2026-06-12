# Plano de Exploração — podigger

> Criado pelo Reversa em 2026-06-04
> Marque cada tarefa com ✅ quando concluída.
> Você pode editar este plano antes de iniciar: adicione, remova ou reordene tarefas conforme necessário.

---

## Fase 1: Reconhecimento 🔍 ✅

- [x] **Scout** — Mapeamento de estrutura de pastas e tecnologias
- [x] **Scout** — Análise de dependências e gerenciadores de pacotes
- [x] **Scout** — Identificação de entry points, CI/CD e configurações

## Decisão de organização das specs 🗂️

> Entre o Scout e o Arqueólogo, o Reversa pergunta como você quer organizar as specs (por módulo, caso de uso, endpoint, híbrida, por features ou customizada). A escolha fica persistida em `.reversa/config.toml` na seção `[specs]` e não será reperguntada em execuções futuras. Para reapresentar o menu, remova manualmente a seção.

## Fase 2: Escavação 🏗️ 🚧

> Preenchido pelo Reversa após o Scout concluir o reconhecimento (2026-06-04).
> Módulos identificados em `.reversa/context/surface.json`.

- [x] **Arqueólogo** — Análise do módulo `accounts` (autenticação, usuários, papéis, permissões)
- [x] **Arqueólogo** — Análise do módulo `podcasts` (podcasts, episódios, tags, busca FTS, popularidade, sugestões)
- [x] **Arqueólogo** — Análise do módulo `config` (settings, URLs raiz, Celery, ASGI/WSGI)
- [x] **Arqueólogo** — Análise do módulo `frontend-ui` (design system: Button, Card, Input, Badge, Icon, Loading)
- [x] **Arqueólogo** — Análise do módulo `frontend-pages` (rotas Next.js: home, login, register, add-podcast, about, auth/*)
- [x] **Arqueólogo** — Análise do módulo `frontend-features` (componentes de feature: home, search, podcasts, episodes, layout, providers, contexts)

## Fase 3: Interpretação 🧠 ✅

- [x] **Detetive** — Arqueologia Git e ADRs retroativos
- [x] **Detetive** — Regras de negócio implícitas e máquinas de estado
- [x] **Detetive** — Matriz de permissões (RBAC/ACL)
- [x] **Arquiteto** — Diagramas C4 (Contexto, Containers, Componentes)
- [x] **Arquiteto** — ERD completo e integrações externas
- [x] **Arquiteto** — Spec Impact Matrix

## Fase 4: Geração 📝 ✅

- [x] **Redator** — `accounts/` (requirements, design, tasks, contracts)
- [x] **Redator** — `podcasts/` (requirements, design, tasks, contracts)
- [x] **Redator** — `config/` (requirements, design, tasks, contracts)
- [x] **Redator** — `frontend-ui/` (requirements, design, tasks, contracts)
- [x] **Redator** — `frontend-pages/` (requirements, design, tasks, contracts)
- [x] **Redator** — `frontend-features/` (requirements, design, tasks, contracts)
- [x] **Redator** — OpenAPI (`openapi/podigger.yaml`)
- [x] **Redator** — User Stories (`user-stories/`)
- [x] **Redator** — Code/Spec Matrix (`traceability/code-spec-matrix.md`)

## Fase 5: Revisão ✅

- [x] **Revisor** — Revisão cruzada de specs
- [x] **Revisor** — Resolução de lacunas com o usuário
- [x] **Revisor** — Relatório de confiança final

---

## Agentes Independentes

> Execute estes agentes quando os recursos estiverem disponíveis — podem rodar em qualquer fase.

- [ ] **Visor** — Análise de interface via screenshots
- [ ] **Data Master** — Análise completa do banco de dados
- [ ] **Design System** — Extração de tokens de design
- [ ] **Tracer** — Análise dinâmica (requer sistema acessível)

---

## Próximo passo

Após o Time de Descoberta concluir e o `_reversa_sdd/` estar populado, você pode disparar um dos fluxos seguintes:

- `/reversa-migrate`: orquestrador do **Time de Migração** (Paradigm Advisor → Curator → Strategist → Designer → Screen Translator → Inspector). Gera as specs do sistema novo. Saída em `_reversa_sdd/migration/` e `_reversa_sdd/screens/`.
- `/reversa-reconstructor`: gera plano bottom-up para reimplementar o software a partir das specs do legado (uma tarefa por sessão).
