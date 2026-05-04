# ADR-001: Approval Gate para Novos Usuários

> Status: Aceito
> Data: 2026-05-01
> Contexto: Introduzido no commit `94ca2f2` ("feat: creating auth logic and integration")

## Contexto e problema

O podigger é um agregador de podcasts com curadoria editorial. Novos usuários não devem ter acesso imediato a funcionalidades de escrita (adicionar podcasts, criar topic-suggestions) sem validação prévia de um administrador. Antes desta decisão, não havia fluxo de aprovação explícito.

## Decisão

Adotar um gate de aprovação de 2 estágios:

1. **Registro** cria usuário com `approval_status="pending"` e `role="reader"` (default).
2. **Login** é bloqueado para usuários `pending` com HTTP 403 e mensagem PT-BR específica.
3. **Admin** aprova via `POST /api/auth/users/<pk>/approve/`, alterando `approval_status` para `"approved"`.

### Justificativa

- **Curadoria**: o sistema agrega conteúdo via RSS, mas a comunidade precisa ser moderada para evitar spam de podcasts/episódios.
- **Princípio do menor privilégio**: novos usuários começam com permissões mínimas (read) até serem explicitamente promovidos.
- **Trilha mínima**: a aprovação é registrada implicitamente no `updated_at` do `User` (sem log dedicado de quem aprovou).

## Consequências

### Positivas
- 🟢 Reduz superfície de ataque para criação de conteúdo abusivo.
- 🟢 Admin tem controle explícito sobre quem entra.
- 🟢 Mensagem clara ao usuário pending ("Sua conta aguarda aprovação de um administrador").

### Negativas
- 🔴 **Sem auditoria dedicada** — não há registro de qual admin aprovou nem quando (apenas `updated_at`).
- 🔴 **Fricção no onboarding** — usuário precisa esperar aprovação manual.
- 🟡 **Mensagens de erro em PT-BR embutidas nas views** — dificulta i18n futura.

## Alternativas consideradas

1. **Auto-aprovação com flag `is_active`**: rejeitada. Colapsa 2 estados (pendente vs ativo) em 1, perdendo a semântica de "aguardando".
2. **Aprovação por e-mail com link mágico**: rejeitada por enquanto. Exigiria configurar SMTP e lidaria com cliques por engano.
3. **Aprovação por outro usuário (sponsorship)**: rejeitada. Adiciona complexidade sem ganho claro; o admin é o ponto de controle único.
