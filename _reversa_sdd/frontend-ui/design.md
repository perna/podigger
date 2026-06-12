# frontend-ui, Design Técnico

> Spec gerada pelo Redator em 2026-06-06
> `doc_level` = `completo`
> Unit: módulo de design system do frontend (`frontend/src/components/ui/` + `frontend/src/lib/utils.ts`)

**Escala de confiança:** 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## Interface

### Componentes exportados

#### `Button` (React 19 `forwardRef`)

```ts
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';   // default 'primary'
  size?: 'sm' | 'md' | 'lg' | 'icon';                        // default 'md'
  isLoading?: boolean;
}

const Button: React.ForwardRefExoticComponent<
  ButtonProps & React.RefAttributes<HTMLButtonElement>
>;
```

**Mapeamento `variant` → classes Tailwind:**

| `variant` | Classes |
|-----------|---------|
| `primary` | `bg-primary text-background-dark hover:brightness-110 shadow-lg shadow-primary/20` |
| `secondary` | `bg-white/10 text-white hover:bg-white/20` |
| `ghost` | `bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5` |
| `outline` | `bg-transparent border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5` |

**Mapeamento `size` → classes Tailwind:**

| `size` | Classes |
|--------|---------|
| `sm` | `h-10 px-6 text-sm` |
| `md` | `h-12 px-8 text-base` |
| `lg` | `h-16 px-10 text-lg leading-none` |
| `icon` | `size-10 p-0` (quadrado 40×40) |

**Classes base (sempre aplicadas):**
- `inline-flex items-center justify-center gap-2 rounded-full font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none`

**Comportamento:**
- `disabled = isLoading || props.disabled` (sempre)
- `isLoading=true` → renderiza `<LoadingSpinner className="size-5" />` no lugar de `children`
- `children` passado via spread (não renderizado quando loading)
- `displayName = 'Button'`

---

#### `Card` (React 19 `forwardRef`)

```ts
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;  // default false
}

const Card: React.ForwardRefExoticComponent<
  CardProps & React.RefAttributes<HTMLDivElement>
>;
```

**Classes base:** `rounded-3xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 transition-all overflow-hidden`

**`hoverable=true` adiciona:** `hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1`

**Comportamento:** Puro `<div>` com spread de props. Sem estado. Sem hooks.

---

#### `Input` (React 19 `forwardRef`)

```ts
type InputProps = InputHTMLAttributes<HTMLInputElement>;

const Input: React.ForwardRefExoticComponent<
  InputProps & React.RefAttributes<HTMLInputElement>
>;
```

**Classes fixas:** `flex h-12 w-full rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 px-4 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all font-display`

**Comportamento:** Puro `<input>` com spread de todos os atributos HTML padrão. Sem `forwardRef` específico além do nativo.

---

#### `Badge`

```ts
interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';  // default 'primary'
}

const Badge: React.FunctionComponent<BadgeProps>;
```

**Mapeamento `variant` → classes:**

| `variant` | Classes |
|-----------|---------|
| `primary` | `bg-primary text-background-dark` |
| `secondary` | `bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100` |
| `outline` | `border border-slate-200 text-slate-900 dark:border-slate-800 dark:text-slate-100` |
| `ghost` | `bg-transparent text-slate-500` |

**Classes base:** `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold transition-colors`

**Comportamento:** Função regular (não `forwardRef`). Puro `<div>` com spread.

---

#### `Icon`

```ts
interface IconProps extends HTMLAttributes<HTMLSpanElement> {
  name: string;            // obrigatório — ligature Material Symbols
  fill?: boolean;          // default false → FILL=0
  weight?: number;         // default 400 → wght=400
  grade?: number;          // default 0   → GRAD=0
  opticalSize?: number;    // default 24  → opsz=24
}

const Icon: React.FunctionComponent<IconProps>;
```

**Comportamento:**
- Renderiza `<span className="material-symbols-rounded select-none" aria-hidden="true" style={{fontVariationSettings: 'FILL {0|1}, wght {w}, GRAD {g}, opsz {o}'}}>{name}</span>`
- Dependência externa: fonte `Material Symbols Rounded` carregada no `RootLayout` (`frontend/src/app/layout.tsx`)
- Caller é responsável por acessibilidade (label externo ou `aria-label` no botão que envolve)

---

#### `LoadingSpinner`

```ts
const LoadingSpinner: React.FunctionComponent<React.HTMLAttributes<SVGSVGElement>>;
```

**Comportamento:** SVG inline de 24×24 com path de spinner (arco de 9 unidades) e `animate-spin` aplicado. Stroke `currentColor` herda cor do contexto.

**SVG path:** `M21 12a9 9 0 1 1-6.219-8.56` (arco de 270° no sentido horário)

---

#### `Skeleton`

```ts
const Skeleton: React.FunctionComponent<React.HTMLAttributes<HTMLDivElement>>;
```

**Classes fixas:** `animate-pulse rounded-md bg-slate-200 dark:bg-slate-800`

**Comportamento:** Puro `<div>` com spread. Caller controla tamanho via `className` (ex.: `className="h-20 w-full"`).

---

#### `FullPageLoading`

```ts
const FullPageLoading: React.FunctionComponent;
```

**Comportamento:** Renderiza `<div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"><LoadingSpinner className="size-12 text-primary" /></div>`. Sem props, sem ref. Usado em transições autenticadas.

---

### Utilitários exportados (`frontend/src/lib/utils.ts`)

#### `cn(...inputs: ClassValue[]): string`

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `...inputs` | `ClassValue[]` | Strings, condicionais, arrays ou objetos com chaves booleanas |

**Pipeline:** `clsx(inputs)` → `tailwind-merge(clsx(inputs))`

**Comportamento:**
- Aceita qualquer combinação: `cn('px-4', isActive && 'bg-primary', { 'text-white': hasText })`
- Resolve conflitos Tailwind: `cn('px-4', 'px-8')` → `'px-8'` (último vence)
- Retorna string vazia se todos os inputs forem falsy

#### `formatDuration(seconds: number): string`

| Input | Output |
|-------|--------|
| `0` ou `NaN` ou `null`/`undefined` | `'0:00'` |
| `< 3600` (sem horas) | `'M:SS'` (padStart 2) |
| `>= 3600` | `'H:MM:SS'` (todas as 3 partes com pad) |

**Algoritmo:** `hours = floor(s/3600)`, `minutes = floor((s%3600)/60)`, `secs = floor(s%60)`. Concatenação condicional.

#### `formatDate(date: string | Date): string`

| Input | Output |
|-------|--------|
| `null`/`undefined`/`''` | `''` (string vazia) |
| ISO string ou `Date` object | `Intl.DateTimeFormat('pt-BR', {year: 'numeric', month: 'short', day: 'numeric'}).format(new Date(date))` |

**Exemplo:** `formatDate('2025-03-15')` → `'15 de mar. de 2025'`

---

## Fluxo Principal

### Renderização do `Button` (caminho feliz)

1. Caller invoca `<Button variant="primary" size="md">Salvar</Button>`
2. `forwardRef` desestrutura props: `variant='primary'`, `size='md'`, `isLoading=undefined`, `children='Salvar'`, `ref=undefined`
3. `cn()` recebe array com classes base + chave de variant + chave de size
4. `clsx` resolve a condicional do objeto `{ 'classe-x': variant === 'primary', ... }` em string única
5. `twMerge` resolve conflitos entre as classes aplicadas (idempotente quando não há conflito)
6. `disabled = isLoading || props.disabled` = `false || undefined` = `false`
7. Renderiza `<button ref={ref} className={final} disabled={false}>` com `<span>Salvar</span>` (children)
8. DOM exibe botão com classes de variant 'primary' + size 'md'

### Renderização do `Button` com `isLoading=true`

1. Caller invoca `<Button isLoading>Salvar</Button>`
2. `cn()` resolve classes normalmente
3. `disabled = true || ...` = `true`
4. Renderiza `<button disabled>` com `<LoadingSpinner className="size-5" />` no lugar de `children`
5. `LoadingSpinner` herda `currentColor` (padrão text do botão) e `animate-spin`

### Renderização do `Icon`

1. Caller invoca `<Icon name="search" weight={500} fill />`
2. Constrói `fontVariationSettings = "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24"`
3. `cn('material-symbols-rounded select-none', undefined)` → `'material-symbols-rounded select-none'`
4. Renderiza `<span aria-hidden="true" style={{...}} class="...">search</span>`
5. Fonte `Material Symbols Rounded` (carregada no layout) substitui ligature `search` pelo glyph correspondente

### `cn()` em cascata

1. `cn('px-4', false, condition && 'px-8')` com `condition=true`
2. `clsx(['px-4', false, 'px-8'])` → `'px-4 px-8'`
3. `twMerge('px-4 px-8')` → `'px-8'` (conflito resolvido pela última)
4. Retorna `'px-8'`

### `formatDuration(3725)`

1. `seconds = 3725` (truthy, não-NaN)
2. `hours = floor(3725/3600) = 1`
3. `minutes = floor((3725%3600)/60) = floor(125/60) = 2`
4. `secs = floor(3725%60) = 5`
5. `hours > 0` → retorna `'1:02:05'` (com `padStart(2, '0')` em minutes e secs)

### `formatDuration(0)`

1. `seconds = 0` → `!seconds` é `true` (0 é falsy em JS)
2. Retorna `'0:00'` (sentinela para input inválido)

### `formatDate('2025-03-15')`

1. `date = '2025-03-15'` (truthy)
2. `new Date('2025-03-15')` cria `Date` UTC meia-noite
3. `Intl.DateTimeFormat('pt-BR', {...}).format(d)` retorna `'15 de mar. de 2025'` (formato curto PT-BR)
4. Retorna string formatada

---

## Fluxos Alternativos

- **Sem fonte Material Symbols carregada:** `<Icon name="search" />` renderiza `<span>search</span>` literal (texto visível). Sem fallback in-module — caller deve garantir que a fonte está no layout.
- **Cores `dark:` aplicadas sem `ThemeProvider` ativo:** classes `dark:bg-surface-dark`, `dark:text-white` etc. ficam inertes (variante Tailwind `dark:` só ativa com classe `dark` em ancestral). Caller deve garantir que `<html class="dark">` ou `<html class="light">` está presente (gerenciado em `frontend-features/ThemeProvider`).
- **`isLoading=true` + `disabled=true` explícito:** `disabled = isLoading || disabled = true` (idempotente). Spinner é renderizado.
- **`formatDuration(NaN)`:** `isNaN(NaN)` é `true` → retorna `'0:00'`. Sem exceção lançada.
- **`formatDate(0)` (timestamp numérico):** `!0` é `true` (0 é falsy) → retorna `''`. Gotcha: 0 timestamp (epoch) é falsy em JS — caller deve passar string ISO ou `Date` object.
- **`cn()` com array vazio:** `cn()` → `twMerge(clsx([]))` → `''`. Sem erro.
- **`Icon` com `name` desconhecido:** Material Symbols renderiza glyph de "fallback" (geralmente `help`) se o nome não existe na fonte. Sem aviso em runtime.

---

## Dependências

| Componente / util | Depende de | Razão |
|-------------------|------------|-------|
| `Button` | `LoadingSpinner` (Loading.tsx) | Renderiza spinner no lugar de children quando `isLoading=true` |
| `FullPageLoading` | `LoadingSpinner` (Loading.tsx) | Overlay com spinner central |
| Todos os componentes | `cn` (lib/utils.ts) | Merge de classes Tailwind |
| `cn` | `clsx` (lib npm) | Conditional class join |
| `cn` | `tailwind-merge` (lib npm) | Resolução de conflitos Tailwind |
| `Icon` | Fonte `Material Symbols Rounded` (carregada em `app/layout.tsx`) | Glyphs renderizados via ligatures |
| `Icon` (em produção) | `tailwind.config` reconhecendo `material-symbols-rounded` | Garante que a classe não é purgada pelo JIT |

**Dependências externas (versões inferidas de `frontend/package.json`):**

| Lib | Versão | Uso |
|-----|--------|-----|
| `react` | 19.2.1 | `forwardRef`, tipos |
| `clsx` | (não-fixada) | Conditional class joining |
| `tailwind-merge` | (não-fixada) | Tailwind conflict resolution |
| `material-symbols-rounded` (fonte) | — | Glyphs via ligatures |

---

## Decisões de Design Identificadas

| Decisão | Evidência no código | Confiança |
|---------|---------------------|-----------|
| Usar `forwardRef` em Button, Card, Input para integração com libs externas (RHF, framer-motion) | `Button.tsx:15`, `Card.tsx:11`, `Input.tsx:10` | 🟢 |
| Variantes via objeto passado a `cn()` (declarativo) em vez de switch/if-else | `Button.tsx:23-30`, `Badge.tsx:17-20` | 🟢 |
| Tokens semânticos (`bg-primary`, `bg-surface-dark`, `bg-background-dark`) sem hex hardcoded | `Button.tsx:23`, `Card.tsx:17`, `Input.tsx:16` | 🟢 |
| `displayName` explícito em componentes `forwardRef` para DevTools | `Button.tsx:42`, `Card.tsx:25`, `Input.tsx:23` | 🟢 |
| `cn()` combinando `clsx` + `tailwind-merge` (padrão shadcn/ui) | `lib/utils.ts:8-10` | 🟢 |
| `Icon` como `<span>` com `aria-hidden='true'` — caller é responsável pela label externa | `Icon.tsx:30` | 🟢 |
| `formatDate` fixo em PT-BR (não i18n-agnostic) — decisão consciente para app brasileiro | `lib/utils.ts:33` | 🟢 |
| `formatDuration` retorna `'0:00'` em input falsy/NaN (sentinela) em vez de lançar | `lib/utils.ts:16` | 🟢 |
| `formatDate` retorna `''` em input falsy (sentinela) em vez de lançar | `lib/utils.ts:32` | 🟢 |
| `Skeleton` usa `bg-slate-200`/`bg-slate-800` (hex-derivados) em vez de `bg-surface` para contraste sutil | `Loading.tsx:32` | 🟢 |
| `FullPageLoading` usa `z-[100]` (arbitrary value) — overlay acima de tudo, exceto modais que também usam z alto | `Loading.tsx:43` | 🟢 |
| `Button.isLoading` desabilita botão (não apenas substitui children) — UX de "ação em andamento" | `Button.tsx:34, 37` | 🟢 |
| Sem testes unitários dedicados aos primitivos — cobertos implicitamente via testes de feature | (ausência) `frontend/src/components/ui/__tests__/` | 🟡 |
| `Icon` aceita `name: string` (sem enum) — máxima flexibilidade, mas tipagem fraca (sem autocomplete) | `Icon.tsx:4` | 🟡 |
| `Badge` não usa `forwardRef` — raramente precisa de ref externa | `Badge.tsx:11` (não-forwardRef) | 🟢 |

---

## Estado Interno

Nenhum componente deste módulo mantém estado interno (sem `useState`, `useEffect`, `useReducer`, contexto próprio). Todo o comportamento é função pura das props.

- **Sem cache de classe** — `cn()` recalcula a string a cada render. Aceitável dado que o número de classes é pequeno (5-15) e a operação é O(n).
- **Sem memoização** — componentes não usam `React.memo`. Renders são baratos (cálculo de string + 1 elemento DOM).

---

## Observabilidade

Nenhuma observabilidade explícita (logs, métricas, traces) emitida por este módulo. Componentes são puros e silenciosos:

- ❌ Sem `console.log` / `console.error`
- ❌ Sem `ErrorBoundary` interno
- ❌ Sem métricas (Prometheus, OTel)
- ❌ Sem telemetria de uso

**Sinais de erro observáveis indiretamente:**
- `Button` com `isLoading=true` em fetch eterno: usuário vê spinner sem timeout visual (depende do caller adicionar timeout/error state)
- `formatDuration(NaN)` / `formatDate(null)`: caller pode receber `'0:00'` ou `''` e não saber que houve input inválido

🟡 **Lacuna de observabilidade:** componentes silenciosos — caller precisa instrumentar a camada de feature (frontend-features) para capturar erros e métricas.

---

## Riscos e Lacunas

- 🔴 **R-UI-L1** — Componentes deste módulo **não têm testes unitários próprios**. Cobertura é implícita via testes de feature. Risco: refatoração visual pode quebrar contratos de classe sem teste falhar. Recomendação: adicionar `frontend/src/components/ui/__tests__/Button.test.tsx`, `Card.test.tsx`, `Icon.test.tsx`, `utils.test.ts`.
- 🟡 **R-UI-L2** — `Icon` aceita `name: string` sem enum nem autocomplete. Caller pode passar nome de glyph inexistente sem aviso. Recomendação futura: gerar union type a partir de `material-symbols-rounded` typings.
- 🟡 **R-UI-L3** — `formatDate` fixo em PT-BR — sem suporte a multi-idioma. App é PT-BR only, mas se internacionalizar, terá que refatorar todas as chamadas.
- 🟡 **R-UI-L4** — `FullPageLoading` usa `z-[100]` (arbitrary) sem constante — caller que renderizar modal/portal com z>100 vai ficar abaixo do overlay. Documentar convenção: `z-100` = loading overlay global; `z-50` = modal.
- 🟡 **R-UI-L5** — Tema dark/light depende de classe `dark` no `<html>` (gerenciado por `ThemeProvider` em `frontend-features`). Se o ThemeProvider não estiver no layout, classes `dark:` ficam inertes. Acoplamento implícito.
- 🟡 **R-UI-L6** — `Card.hoverable` aplica `:hover` mas não `:focus-visible` — elementos `Card` interativos (links) perdem affordance de teclado. Caller precisa adicionar `tabIndex` + estilos de focus manualmente.
- 🟡 **R-UI-L7** — Sem fallback para fonte `Material Symbols` não carregada — `<Icon>` exibe texto literal. Caller deve garantir que a fonte está no `RootLayout`.
- 🟡 **R-UI-L8** — `cn()` é executado a cada render sem cache. Em listas muito grandes (ex.: 1000 cards), pode haver overhead marginal. Não medido.
- 🟡 **R-UI-L9** — `Button` aceita `onClick` mas não tem confirmação visual de ação destrutiva (ex.: delete). Caller precisa implementar modal ou undo pattern.
- 🟡 **R-UI-L10** — `Skeleton` aplica `bg-slate-200` mas o tema dark usa `bg-slate-800` — não há mecanismo para mudar essas cores via prop (são hardcoded). Pequena lacuna de flexibilidade.
- 🟡 **R-UI-L11** — `formatDuration(0)` retorna `'0:00'` — semanticamente correto, mas caller pode confundir com "0 minutos e 0 segundos" quando na verdade é "duração desconhecida". Documentar no JSDoc (hoje ausente) que 0 é sentinela.
- 🟡 **R-UI-L12** — `Icon` força `aria-hidden='true'` mesmo quando caller passa `aria-hidden={false}` via spread (spread vem depois de `aria-hidden`). Bug latente se caller quiser tornar acessível. Fix: `{...props}` antes de `aria-hidden` no JSX, ou remover a atribuição hardcoded.
