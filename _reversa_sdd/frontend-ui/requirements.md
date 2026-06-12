# frontend-ui

> Spec gerada pelo Redator em 2026-06-06
> `doc_level` = `completo`
> Unit: módulo de design system do frontend (`frontend/src/components/ui/` + `frontend/src/lib/utils.ts`)
> Granularidade: `module`

**Escala de confiança:** 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## Visão Geral

O módulo `frontend-ui` é a **biblioteca de primitivos visuais** do podigger. Concentra componentes React de baixo nível reaproveitáveis (Button, Card, Input, Badge, Icon, LoadingSpinner, Skeleton, FullPageLoading) e o utilitário `cn` (merge Tailwind) usado por todos os demais módulos do frontend. Não contém regra de negócio, não acessa API, não mantém estado próprio além do que recebe via props. É a única camada de UI que o restante da aplicação consome sem remounting excessivo — variações de cor, tamanho e forma são resolvidas por classes Tailwind aplicadas em runtime, sem CSS-in-JS nem styled-components.

## Responsabilidades

- Expor os 6 primitivos de UI (`Button`, `Card`, `Input`, `Badge`, `Icon`, `LoadingSpinner`/`Skeleton`/`FullPageLoading`) prontos para consumo.
- Centralizar variantes visuais via prop `variant` (Button, Badge) e prop `size` (Button) com `cn()` declarativo.
- Expor `forwardRef` em primitivos que precisam anexar referência DOM (Button, Card, Input).
- Resolver a fonte Material Symbols Rounded via prop `Icon` (apenas injeta `fontVariationSettings` — a fonte é carregada no `RootLayout`).
- Fornecer o helper `cn(...inputs)` que combina `clsx` (condicional) + `tailwind-merge` (conflito Tailwind) como utilitário padrão de toda a app.
- Fornecer formatadores de domínio `formatDuration(seconds)` (HH:MM:SS ou M:SS) e `formatDate(date)` (pt-BR) usados pelas features de episódios e podcasts.
- Suportar dark mode via classes Tailwind `dark:*` — não implementa a lógica de troca de tema (responsabilidade do `ThemeProvider` em `frontend-features`).

## Regras de Negócio

- 🟢 **R-UI-01** — `Button` desabilita (e bloqueia clique) quando `isLoading=true` OU `props.disabled=true`. Em `isLoading`, renderiza `<LoadingSpinner />` no lugar de `children`.
- 🟢 **R-UI-02** — `cn(inputs)` resolve conflitos Tailwind pelo **último vence**: `cn('px-4', 'px-8')` resulta em `'px-8'`. Comportamento herdado de `tailwind-merge`.
- 🟢 **R-UI-03** — `formatDuration(0)` e `formatDuration(NaN)` retornam `'0:00'` (sentinela para input inválido/falsy).
- 🟢 **R-UI-04** — `formatDuration(seconds)` retorna `H:MM:SS` quando `hours > 0`, senão `M:SS` (com `padStart(2, '0')` em minutos e segundos).
- 🟢 **R-UI-05** — `formatDate(null|'')` e `formatDate(undefined)` retornam string vazia `''` (sem lançar exceção).
- 🟢 **R-UI-06** — `formatDate(date)` usa `Intl.DateTimeFormat('pt-BR', { year: 'numeric', month: 'short', day: 'numeric' })` (formato curto PT-BR: `15 de mar. de 2025`).
- 🟢 **R-UI-07** — `Icon` sempre renderiza `aria-hidden='true'` e é puramente decorativo quando consumido isoladamente — a acessibilidade do significado é responsabilidade do caller (envolver em `<button aria-label="...">` ou usar `<span>` com texto adjacente).
- 🟢 **R-UI-08** — `FullPageLoading` cobre a viewport com `fixed inset-0 z-[100]` e `backdrop-blur-sm` para isolar a interação durante transições autenticadas — é o overlay de loading mais alto da aplicação.
- 🟢 **R-UI-09** — `Skeleton` aplica `animate-pulse` com fundo `bg-slate-200 dark:bg-slate-800` (cores semânticas, não hex) — placeholder pronto para preencher com `cn()`.
- 🟡 **R-UI-10** — Nenhum primitivo deste módulo implementa teste unitário próprio — são cobertos implicitamente via testes de feature em `frontend/src/**/__tests__/`. Decisão consciente, mas 🔴 lacuna de cobertura.
- 🟡 **R-UI-11** — `Icon` depende da fonte `Material Symbols Rounded` estar carregada no `RootLayout` (`frontend/src/app/layout.tsx`). Sem a fonte, o glyph aparece como ligature literal (`<span>search</span>`). Não há fallback in-module.
- 🟡 **R-UI-12** — `Card.hoverable` aplica efeito de elevação (`hover:shadow-xl hover:-translate-y-1`) sem gerenciar `:focus-visible` — caller precisa de `tabIndex` + `role` se quiser interação por teclado.

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | `Button` aceita `variant: 'primary' \| 'secondary' \| 'ghost' \| 'outline'` (default `'primary'`) e `size: 'sm' \| 'md' \| 'lg' \| 'icon'` (default `'md'`) | Must | Renderizar `<Button variant="secondary" size="lg" />` aplica `bg-white/10 text-white` + `h-16 px-10 text-lg` ao `<button>`. |
| RF-02 | `Button` aceita `isLoading?: boolean` que substitui `children` por `<LoadingSpinner />` e desabilita o botão | Must | `<Button isLoading>Salvar</Button>` renderiza spinner e `disabled=true`. |
| RF-03 | `Card` aceita `hoverable?: boolean` (default `false`) que aplica `hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1` | Should | `<Card hoverable>` mostra efeito de elevação ao passar o mouse. |
| RF-04 | `Input` aceita todos os atributos HTML padrão via spread (`type`, `placeholder`, `value`, `onChange`, etc.) | Must | `<Input type="email" required />` renderiza `<input type="email" required />` com classes do design system. |
| RF-05 | `Badge` aceita `variant: 'primary' \| 'secondary' \| 'outline' \| 'ghost'` (default `'primary'`) | Should | `<Badge variant="outline">Tag</Badge>` renderiza com borda. |
| RF-06 | `Icon` aceita `name: string` (obrigatório), `fill?: boolean`, `weight?: number`, `grade?: number`, `opticalSize?: number` | Must | `<Icon name="search" weight={500} />` renderiza glyph `search` com `wght=500`. |
| RF-07 | `Icon` aplica `fontVariationSettings` no formato `'FILL' {0\|1}, 'wght' {w}, 'GRAD' {g}, 'opsz' {o}` | Must | `style.fontVariationSettings` do `<span>` contém os 4 eixos. |
| RF-08 | `LoadingSpinner` aceita `className` para customização de tamanho/cor | Must | `<LoadingSpinner className="size-12 text-primary" />` aplica ambas as classes. |
| RF-09 | `Skeleton` aplica `animate-pulse rounded-md bg-slate-200 dark:bg-slate-800` ao `<div>` | Should | `<Skeleton className="h-20 w-full" />` renderiza placeholder cinza pulsante. |
| RF-10 | `FullPageLoading` renderiza overlay `fixed inset-0 z-[100]` com `LoadingSpinner size-12 text-primary` centralizado | Should | Renderizado durante transições autenticadas; bloqueia interação com o resto da página. |
| RF-11 | `cn(...inputs)` aceita `ClassValue[]` (strings, condicionais, arrays, objetos) e retorna string mesclada sem conflitos Tailwind | Must | `cn('px-4', condition && 'px-8')` retorna `'px-8'` quando `condition=true`. |
| RF-12 | `formatDuration(seconds: number): string` retorna `'H:MM:SS'` quando `>= 3600`, senão `'M:SS'`; retorna `'0:00'` em input falsy/NaN | Must | `formatDuration(3725)` → `'1:02:05'`; `formatDuration(125)` → `'2:05'`; `formatDuration(0)` → `'0:00'`. |
| RF-13 | `formatDate(date: string \| Date): string` retorna data formatada `pt-BR` curta; retorna `''` em input falsy | Must | `formatDate('2025-03-15')` → `'15 de mar. de 2025'`; `formatDate(null)` → `''`. |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência no código | Confiança |
|------|--------------------|---------------------|-----------|
| Performance | Componentes são funções puras sem `useState`/`useEffect` — não causam re-render por si mesmos | `Button.tsx`, `Card.tsx`, `Icon.tsx` — sem hooks | 🟢 |
| Performance | `cn()` é O(n) no número de classes e roda em tempo de render; aceitável para o tamanho típico (5-15 classes) | `lib/utils.ts:8-10` | 🟢 |
| Acessibilidade | `Icon` força `aria-hidden='true'` e depende do caller fornecer label externo | `Icon.tsx:30` | 🟢 |
| Acessibilidade | `Button` repassa `disabled` nativo — leitor de tela anuncia estado | `Button.tsx:34` | 🟢 |
| Manutenibilidade | Tokens semânticos (`bg-primary`, `text-background-dark`, `bg-surface-dark`) sem hex hardcoded — refatoração de tema centralizada no Tailwind config | `Button.tsx:23-26`, `Card.tsx:17`, `Input.tsx:16`, `Badge.tsx:17-20` | 🟢 |
| Manutenibilidade | `forwardRef` em Button, Card, Input permite integração com libs de form/animation (RHF, framer-motion) | `Button.tsx:15`, `Card.tsx:11`, `Input.tsx:10` | 🟢 |
| Compatibilidade | Dependência da fonte `Material Symbols Rounded` carregada no `RootLayout` (escopo do módulo `frontend-pages`) | `Icon.tsx:26` + `app/layout.tsx` | 🟢 |
| Bundle | Componentes não importam deps pesadas — apenas `react`, `clsx`, `tailwind-merge` | `Button.tsx:1-3`, `utils.ts:1-2` | 🟢 |
| DX | `displayName` explícito em `forwardRef` para DevTools legíveis | `Button.tsx:42`, `Card.tsx:25`, `Input.tsx:23` | 🟢 |
| Internacionalização | `formatDate` fixo em PT-BR; sem suporte a multi-idioma (gap conhecido em DT-9) | `utils.ts:33-37` | 🟡 |

> Inferido a partir do código. Validar com equipe de design/frontend.

## Critérios de Aceitação

```gherkin
Dado que o consumidor importa Button do design system
Quando renderiza <Button variant="primary">Salvar</Button>
Então o <button> rendered tem classes "bg-primary text-background-dark ... rounded-full font-bold"
  e está habilitado (disabled=false)

Dado que o consumidor renderiza <Button isLoading>Salvar</Button>
Quando o React monta o componente
Então o <button> tem disabled=true
  e exibe <LoadingSpinner> no lugar do texto "Salvar"
  e mantém as classes de variant/size originais

Dado que o consumidor chama cn('px-4', false, 'text-red-500', condition && 'px-8')
Quando condition é true
Então o resultado é 'text-red-500 px-8' (px-4 descartado por twMerge)

Dado que o consumidor renderiza <Icon name="search" weight={500} opticalSize={32} fill />
Quando o React monta o componente
Então o <span> tem classe 'material-symbols-rounded select-none'
  e style.fontVariationSettings = "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 32'"
  e aria-hidden="true"

Dado que o consumidor chama formatDuration(3725)
Quando a função executa
Então retorna '1:02:05'

Dado que o consumidor chama formatDuration(0)
Quando a função executa
Então retorna '0:00' (sentinela para input inválido)

Dado que o consumidor chama formatDate('2025-03-15')
Quando a função executa
Então retorna string contendo '15', 'mar' e '2025' em PT-BR

Dado que o consumidor chama formatDate(null)
Quando a função executa
Então retorna '' (string vazia, sem lançar exceção)

Dado que o consumidor renderiza <FullPageLoading />
Quando o React monta o componente
Então um <div fixed inset-0 z-[100]> cobre a viewport inteira
  e exibe <LoadingSpinner size-12 text-primary> centralizado
  e o backdrop tem blur-sm
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| Button (variants + size + isLoading) | Must | Chamado em 100% das ações de UI (login, register, add-podcast, search, modais) |
| `cn()` utilitário | Must | Importado por todos os 6 componentes deste módulo + features |
| Icon (font variation) | Must | Substitui qualquer SVG inline; usado em navbar, botões, cards |
| formatDuration / formatDate | Must | Renderizado em listas de episódios (ranking, infinite scroll) |
| Input (HTML padrão) | Must | Formulários de login, register, add-podcast |
| Card (container) | Must | Container visual de episódio e podcast |
| LoadingSpinner | Must | Estado de loading em fetches e transições |
| Badge (variants) | Should | Decorativo, pode ser substituído por classes Tailwind ad-hoc |
| Skeleton | Should | Loading state melhor que spinner para listas |
| Card hoverable | Should | Efeito cosmético, não bloqueia usabilidade |
| FullPageLoading | Should | Usado raramente, em transições longas de auth |
| Suporte a RTL | Won't | Não detectado no código nem em i18n config |

> Prioridade inferida por frequência de chamada e posição na cadeia de dependências.

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---------|-----------------|-----------|
| `frontend/src/components/ui/Button.tsx` | `Button` (forwardRef), `ButtonProps` interface | 🟢 |
| `frontend/src/components/ui/Button.tsx` | `Button.displayName = 'Button'` | 🟢 |
| `frontend/src/components/ui/Card.tsx` | `Card` (forwardRef), `CardProps` interface | 🟢 |
| `frontend/src/components/ui/Input.tsx` | `Input` (forwardRef), `InputProps` type alias | 🟢 |
| `frontend/src/components/ui/Badge.tsx` | `Badge`, `BadgeProps` interface | 🟢 |
| `frontend/src/components/ui/Icon.tsx` | `Icon`, `IconProps` interface | 🟢 |
| `frontend/src/components/ui/Loading.tsx` | `LoadingSpinner`, `Skeleton`, `FullPageLoading` | 🟢 |
| `frontend/src/lib/utils.ts` | `cn(...inputs)` (clsx + tailwind-merge) | 🟢 |
| `frontend/src/lib/utils.ts` | `formatDuration(seconds)` | 🟢 |
| `frontend/src/lib/utils.ts` | `formatDate(date)` | 🟢 |
| `frontend/src/app/layout.tsx` | (referência) Carrega fonte Material Symbols Rounded | 🟢 (externo) |

> Este módulo é puramente de apresentação. Não há endpoints, modelos ou regras de negócio. A cobertura é 100% sobre os 8 componentes exportados.
