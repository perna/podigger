# Legacy Mapping — Módulo `frontend-ui`

> Mapeamento de arquivos do projeto legado que compõem este módulo.
> Gerado pelo Arqueólogo em 2026-06-04.

## Arquivos do legado

| Caminho | Linhas | Função no módulo |
|---------|--------|------------------|
| `frontend/src/components/ui/Button.tsx` | 43 | Componente `Button` com variantes (primary/secondary/ghost/outline), tamanhos e estado `isLoading` |
| `frontend/src/components/ui/Card.tsx` | 27 | Componente `Card` com opção `hoverable` (efeito de elevação) |
| `frontend/src/components/ui/Input.tsx` | 25 | Componente `Input` padrão do design system |
| `frontend/src/components/ui/Badge.tsx` | 27 | Componente `Badge` com variantes (primary/secondary/outline/ghost) |
| `frontend/src/components/ui/Icon.tsx` | 36 | Wrapper sobre Material Symbols Rounded com `fontVariationSettings` |
| `frontend/src/components/ui/Loading.tsx` | 47 | `LoadingSpinner` (SVG animado), `Skeleton` (placeholder pulse), `FullPageLoading` (overlay) |

## Dependências diretas (intra-módulo)

| Componente | Importa de | Símbolo |
|------------|------------|---------|
| `Button.tsx` | `./Loading` | `LoadingSpinner` |
| (todos) | `@/lib/utils` | `cn` (clsx + tailwind-merge) |

## Dependências externas (libs)

| Lib | Versão (inferida) | Uso |
|-----|-------------------|-----|
| `react` | 19.2.1 | `forwardRef`, hooks, tipos (`ButtonHTMLAttributes`, `HTMLAttributes`, etc.) |
| `clsx` | (não-fixada) | Conditional class joining |
| `tailwind-merge` | (não-fixada) | Resolução de conflitos Tailwind |
| `material-symbols-rounded` (fonte) | — | Glyphs renderizados via ligatures em `<span>` |

## Convenções observadas

- 🟢 **Padrão shadcn/ui-like**: `cn()` para merge de classes, `forwardRef` em primitivos, `className` prop opcional para override.
- 🟢 **Variantes via `cn` com objeto**: `{ 'classe-x': variant === 'primary', ... }` em vez de switch/if-else (declarativo).
- 🟢 **Tokens semânticos**: `bg-primary`, `text-background-dark`, `bg-surface-dark`, `border-slate-100/800` — nenhum hex hardcoded.
- 🟢 **Display name explícito**: `Button.displayName = 'Button'` (e idem para Card/Input) — necessário para `forwardRef` exibir nome correto em DevTools.
- 🟡 **Estilo de comentário**: JSDoc em PT-EN misturado ("Primary button component for the application" / "Styled to match the Podigger design system"). Não-bloqueante.

## Rastreabilidade para Writer/Designer

Este módulo é puramente de **apresentação** (design system). Não tem:
- Endpoints de API
- Modelos de dados
- Regras de negócio

Specs SDD geradas pelo Writer devem tratar cada componente como uma **unit** (recomenda-se uma unit por componente, dado o tamanho pequeno), ou agrupar como `frontend-ui/primitives` (uma unit contendo os 8 componentes como casos).

Tema escuro/claro é resolvido fora deste módulo: as classes Tailwind `dark:` assumem que o `ThemeProvider` (em `frontend-features`) está ativo.
