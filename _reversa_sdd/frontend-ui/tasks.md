# frontend-ui, Tarefas de Implementação

> Spec gerada pelo Redator em 2026-06-06
> `doc_level` = `completo`
> Unit: módulo de design system do frontend (`frontend/src/components/ui/` + `frontend/src/lib/utils.ts`)

**Escala de confiança:** 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## Pré-requisitos

- [ ] Tailwind CSS v4 configurado no projeto (variantes `dark:`, `hover:`, `focus-visible:`)
- [ ] Fonte `Material Symbols Rounded` carregada no `RootLayout` (escopo do módulo `frontend-pages`, mas dependência dura do `Icon`)
- [ ] Dependências npm instaladas: `react@^19`, `clsx`, `tailwind-merge`
- [ ] `tsconfig.json` com `paths: { "@/*": ["./src/*"] }` para suportar `import { cn } from '@/lib/utils'`
- [ ] `tailwind.config` (ou config v4 equivalente) reconhece `material-symbols-rounded` como font-family utility

---

## Tarefas

> Cada tarefa referencia o arquivo do legado de onde o comportamento foi extraído.

### Utilitário `cn`

- [ ] T-01, Criar `frontend/src/lib/utils.ts` com função `cn(...inputs: ClassValue[]): string`
  - Origem no legado: `frontend/src/lib/utils.ts:8-10`
  - Critério de pronto: `cn('px-4', false && 'hidden', 'px-8')` retorna `'px-8'` (twMerge resolve conflito); `cn('a', condition && 'b')` funciona com `clsx`
  - Confiança: 🟢

### Utilitário `formatDuration`

- [ ] T-02, Criar `formatDuration(seconds: number): string` em `frontend/src/lib/utils.ts`
  - Origem no legado: `frontend/src/lib/utils.ts:15-26`
  - Critério de pronto: `formatDuration(3725) === '1:02:05'`; `formatDuration(125) === '2:05'`; `formatDuration(0) === '0:00'`; `formatDuration(NaN) === '0:00'`
  - Confiança: 🟢

### Utilitário `formatDate`

- [ ] T-03, Criar `formatDate(date: string | Date): string` em `frontend/src/lib/utils.ts`
  - Origem no legado: `frontend/src/lib/utils.ts:31-38`
  - Critério de pronto: `formatDate('2025-03-15')` retorna string contendo `'15'`, `'mar'`, `'2025'` (formato curto PT-BR); `formatDate(null) === ''`; `formatDate('') === ''`
  - Confiança: 🟢

### Componente `Button`

- [ ] T-04, Criar `Button` com `forwardRef<HTMLButtonElement, ButtonProps>` em `frontend/src/components/ui/Button.tsx`
  - Origem no legado: `frontend/src/components/ui/Button.tsx:1-41`
  - Critério de pronto: Componente renderiza `<button>` com classes base, suporta `variant`, `size`, `isLoading`, faz spread de props restantes
  - Confiança: 🟢

- [ ] T-05, Implementar mapeamento `variant: 'primary' | 'secondary' | 'ghost' | 'outline'` → classes Tailwind
  - Origem no legado: `frontend/src/components/ui/Button.tsx:23-26`
  - Critério de pronto: Cada variant aplica as classes exatas (ver tabela em `design.md` § Interface); `variant` não fornecido usa `'primary'`
  - Confiança: 🟢

- [ ] T-06, Implementar mapeamento `size: 'sm' | 'md' | 'lg' | 'icon'` → classes Tailwind
  - Origem no legado: `frontend/src/components/ui/Button.tsx:27-30`
  - Critério de pronto: Cada size aplica altura/largura/padding corretos; `size` não fornecido usa `'md'`
  - Confiança: 🟢

- [ ] T-07, Implementar estado `isLoading`: `disabled = isLoading || props.disabled`; renderiza `<LoadingSpinner className="size-5" />` no lugar de `children`
  - Origem no legado: `frontend/src/components/ui/Button.tsx:34, 37`
  - Critério de pronto: `<Button isLoading>Salvar</Button>` renderiza `<button disabled>` com spinner e sem o texto `'Salvar'`
  - Confiança: 🟢

- [ ] T-08, Adicionar `Button.displayName = 'Button'` após a declaração
  - Origem no legado: `frontend/src/components/ui/Button.tsx:42`
  - Critério de pronto: React DevTools mostra `'Button'` (não `'ForwardRef'`) no nome do componente
  - Confiança: 🟢

### Componente `Card`

- [ ] T-09, Criar `Card` com `forwardRef<HTMLDivElement, CardProps>` em `frontend/src/components/ui/Card.tsx`
  - Origem no legado: `frontend/src/components/ui/Card.tsx:1-25`
  - Critério de pronto: Renderiza `<div>` com classes base; aceita `hoverable` opcional
  - Confiança: 🟢

- [ ] T-10, Implementar classes base + flag `hoverable` que adiciona `hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1`
  - Origem no legado: `frontend/src/components/ui/Card.tsx:17-19`
  - Critério de pronto: `<Card hoverable>` aplica efeito de elevação ao passar o mouse; `<Card>` (sem prop) não aplica
  - Confiança: 🟢

- [ ] T-11, Adicionar `Card.displayName = 'Card'`
  - Origem no legado: `frontend/src/components/ui/Card.tsx:25`
  - Critério de pronto: React DevTools mostra `'Card'`
  - Confiança: 🟢

### Componente `Input`

- [ ] T-12, Criar `Input` com `forwardRef<HTMLInputElement, InputProps>` em `frontend/src/components/ui/Input.tsx`
  - Origem no legado: `frontend/src/components/ui/Input.tsx:1-23`
  - Critério de pronto: Renderiza `<input>` com classes fixas do design system; aceita spread de `InputHTMLAttributes`
  - Confiança: 🟢

- [ ] T-13, Aplicar classes fixas (incluindo `focus-visible:ring-2 focus-visible:ring-primary`, `disabled:opacity-50`, `placeholder:text-slate-400`, `font-display`)
  - Origem no legado: `frontend/src/components/ui/Input.tsx:16`
  - Critério de pronto: Input focado mostra ring primary 2px; input desabilitado tem opacity-50; placeholder tem cor slate-400
  - Confiança: 🟢

- [ ] T-14, Adicionar `Input.displayName = 'Input'`
  - Origem no legado: `frontend/src/components/ui/Input.tsx:23`
  - Critério de pronto: React DevTools mostra `'Input'`
  - Confiança: 🟢

### Componente `Badge`

- [ ] T-15, Criar `Badge` (função, sem `forwardRef`) com `variant: 'primary' | 'secondary' | 'outline' | 'ghost'` em `frontend/src/components/ui/Badge.tsx`
  - Origem no legado: `frontend/src/components/ui/Badge.tsx:1-26`
  - Critério de pronto: Renderiza `<div>` com classes base + variant; aceita `className` e spread de `HTMLAttributes<HTMLDivElement>`
  - Confiança: 🟢

- [ ] T-16, Implementar mapeamento `variant` → classes (primary: `bg-primary text-background-dark`; secondary: `bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100`; outline: `border border-slate-200 text-slate-900 dark:border-slate-800 dark:text-slate-100`; ghost: `bg-transparent text-slate-500`)
  - Origem no legado: `frontend/src/components/ui/Badge.tsx:17-20`
  - Critério de pronto: Cada variant aplica as classes exatas
  - Confiança: 🟢

### Componente `Icon`

- [ ] T-17, Criar `Icon` (função) com props `name: string` (obrigatório), `fill?: boolean`, `weight?: number`, `grade?: number`, `opticalSize?: number` em `frontend/src/components/ui/Icon.tsx`
  - Origem no legado: `frontend/src/components/ui/Icon.tsx:1-36`
  - Critério de pronto: Renderiza `<span>` com classe `material-symbols-rounded select-none`; aceita `name` como ligature
  - Confiança: 🟢

- [ ] T-18, Implementar `fontVariationSettings` no formato `'FILL' {0|1}, 'wght' {w}, 'GRAD' {g}, 'opsz' {o}'` com defaults `(fill=false, weight=400, grade=0, opticalSize=24)`
  - Origem no legado: `frontend/src/components/ui/Icon.tsx:28`
  - Critério de pronto: `<Icon name="search" weight={500} fill />` produz `style={{fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24'"}}`
  - Confiança: 🟢

- [ ] T-19, Aplicar `aria-hidden='true'` no `<span>` (decorativo por padrão)
  - Origem no legado: `frontend/src/components/ui/Icon.tsx:30`
  - Critério de pronto: Atributo `aria-hidden="true"` presente no DOM rendered
  - Confiança: 🟢
  - ⚠️ **Atenção (R-UI-L12):** Spread `{...props}` deve vir **antes** de `aria-hidden` para permitir override pelo caller. Verificar ordem no JSX.

### Componente `LoadingSpinner`

- [ ] T-20, Criar `LoadingSpinner` em `frontend/src/components/ui/Loading.tsx` — SVG inline de 24×24 com path `M21 12a9 9 0 1 1-6.219-8.56`, `fill='none'`, `stroke='currentColor'`, `strokeWidth='2'`, `strokeLinecap='round'`, `strokeLinejoin='round'`, classe `animate-spin`
  - Origem no legado: `frontend/src/components/ui/Loading.tsx:6-24`
  - Critério de pronto: SVG renderiza com animação de rotação; cor herda de `currentColor`
  - Confiança: 🟢

### Componente `Skeleton`

- [ ] T-21, Criar `Skeleton` em `frontend/src/components/ui/Loading.tsx` — `<div>` com classes `animate-pulse rounded-md bg-slate-200 dark:bg-slate-800`
  - Origem no legado: `frontend/src/components/ui/Loading.tsx:29-36`
  - Critério de pronto: Skeleton renderiza placeholder cinza com animação pulse
  - Confiança: 🟢

### Componente `FullPageLoading`

- [ ] T-22, Criar `FullPageLoading` em `frontend/src/components/ui/Loading.tsx` — `<div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">` envolvendo `<LoadingSpinner className="size-12 text-primary" />`
  - Origem no legado: `frontend/src/components/ui/Loading.tsx:41-46`
  - Critério de pronto: Overlay full-screen com spinner centralizado, z-index 100, backdrop blur
  - Confiança: 🟢

---

## Tarefas de Teste

> Adicionar `frontend/src/components/ui/__tests__/` com suítes Vitest + @testing-library/react. Hoje o módulo não tem testes próprios (R-UI-L1 — lacuna de cobertura).

- [ ] TT-01, Teste de `cn`: cobertura dos casos `cn('', 'a')`, `cn('a', 'b')`, `cn({a: true, b: false})`, `cn('px-4', 'px-8')` (verifica resolução de conflito)
  - Critério de pronto: Todos os asserts passam em `utils.test.ts`

- [ ] TT-02, Teste de `formatDuration`: cobertura de `0`, `NaN`, `59`, `60`, `3599`, `3600`, `3725`
  - Critério de pronto: Cada input produz o output esperado (incluindo sentinela `'0:00'` para 0 e NaN)

- [ ] TT-03, Teste de `formatDate`: cobertura de `null`, `undefined`, `''`, ISO string, `Date` object
  - Critério de pronto: Inputs falsy retornam `''`; inputs válidos retornam string PT-BR contendo ano, mês, dia

- [ ] TT-04, Teste de `Button`: renderiza cada variant e cada size; `isLoading=true` mostra spinner e desabilita botão; `disabled=true` desabilita botão
  - Critério de pronto: 4 variants × 4 sizes = 16 casos + 2 estados de loading = 18 asserts passam

- [ ] TT-05, Teste de `Button`: verifica que `className` passada pelo caller é mesclada com classes do design system
  - Critério de pronto: `cn()` resolve conflitos entre classes do caller e do design system

- [ ] TT-06, Teste de `Card`: `hoverable=false` (padrão) não aplica `hover:shadow-xl`; `hoverable=true` aplica
  - Critério de pronto: `getByTestId('card').className` contém/não contém as classes esperadas

- [ ] TT-07, Teste de `Input`: aceita `type`, `placeholder`, `value`, `onChange` via spread
  - Critério de pronto: Atributos propagados para o `<input>` rendered

- [ ] TT-08, Teste de `Badge`: renderiza cada variant; aceita `className` para override
  - Critério de pronto: Classes Tailwind corretas para cada variant

- [ ] TT-09, Teste de `Icon`: renderiza ligature `name` no `<span>`; aplica `aria-hidden='true'`; aplica `fontVariationSettings` correto com defaults e overrides
  - Critério de pronto: `<span>` tem ligature, aria-hidden, e `style.fontVariationSettings` no formato esperado

- [ ] TT-10, Teste de `LoadingSpinner`: SVG renderiza com `animate-spin`; aceita `className` para customização
  - Critério de pronto: SVG com classes corretas no DOM

- [ ] TT-11, Teste de `Skeleton`: renderiza `<div>` com `animate-pulse rounded-md bg-slate-200 dark:bg-slate-800`
  - Critério de pronto: Classes aplicadas

- [ ] TT-12, Teste de `FullPageLoading`: renderiza overlay com `fixed inset-0 z-[100]` e `LoadingSpinner size-12 text-primary` interno
  - Critério de pronto: Estrutura DOM correta

---

## Tarefas de Migração de Dados (se aplicável)

Nenhuma. Este módulo é puramente de UI e não persiste dados.

---

## Ordem Sugerida

1. **T-01 a T-03** (utilitários `cn`, `formatDuration`, `formatDate`) — **bloqueio**: todos os componentes dependem de `cn`.
2. **T-20, T-21** (`LoadingSpinner`, `Skeleton`) — pré-requisito para `Button` (T-07 importa `LoadingSpinner`).
3. **T-04 a T-08** (`Button`) — pode ser feito em paralelo com outros após dependências acima.
4. **T-22** (`FullPageLoading`) — depende de `LoadingSpinner` (T-20).
5. **T-09 a T-11** (`Card`), **T-12 a T-14** (`Input`), **T-15 a T-16** (`Badge`) — paralelos, sem dependência cruzada.
6. **T-17 a T-19** (`Icon`) — depende da fonte `Material Symbols Rounded` carregada no layout (escopo de `frontend-pages`).
7. **TT-01 a TT-12** (testes) — após todos os componentes prontos.

**Bloqueios entre tarefas:**
- T-07 depende de T-20 (`Button.isLoading` usa `LoadingSpinner`).
- T-22 depende de T-20 (`FullPageLoading` usa `LoadingSpinner`).
- T-17 a T-19 (Icon) depende da fonte estar no layout (config de `frontend-pages`).

---

## Lacunas Pendentes (🔴)

- 🔴 **R-UI-L1** — Adicionar testes unitários próprios (TT-01 a TT-12). Hoje não há cobertura; testes são implícitos via features.
- 🟡 **R-UI-L2** — Considerar gerar union type para `Icon.name` a partir de typings oficiais de `material-symbols-rounded` (autocomplete + type-safety).
- 🟡 **R-UI-L6** — `Card.hoverable` não aplica `:focus-visible`. Se Card for usado como link, caller precisa adicionar `tabIndex` + estilos de focus manualmente — ou estender o componente.
- 🟡 **R-UI-L12** — Bug latente em `Icon`: spread `{...props}` é aplicado **antes** de `aria-hidden` no JSX legado, o que significa que caller **não pode** sobrescrever `aria-hidden='true'`. Verificar ordem na reimplementação e decidir se o atributo hardcoded deve ser removível.
- 🟡 **R-UI-L11** — Documentar no JSDoc de `formatDuration` que `0` é sentinela para "duração desconhecida", não zero segundos reais.
- 🟡 **R-UI-L4** — Documentar convenção de z-index: `z-[100]` = loading overlay global; reservas para modais/tooltips devem ficar abaixo.
- 🟢 **R-UI-L3** — `formatDate` fixo em PT-BR é decisão consciente (app brasileiro). Se internacionalizar no futuro, refatorar para `Intl.DateTimeFormat(locale, opts)`.

---

> Implementação completa deste módulo é **estritamente isolada**: zero estado, zero side effects, zero acesso a API. Pode ser feito em uma única sessão sem dependências externas além de Tailwind/React configurados.
