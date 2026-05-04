# Fluxograma — Módulo `frontend-ui`

> Gerado pelo Arqueólogo em 2026-06-04
> Módulo: `frontend-ui` (design system: Button, Card, Input, Badge, Icon, Loading)

## Inventário de componentes

| Componente | Arquivo | Tipo de export | Composição |
|------------|---------|----------------|------------|
| `Button` | `Button.tsx` | `forwardRef` (React 19) | Usa `LoadingSpinner` quando `isLoading=true` |
| `Card` | `Card.tsx` | `forwardRef` (React 19) | Puro (apenas `<div>`) |
| `Input` | `Input.tsx` | `forwardRef` (React 19) | Puro (apenas `<input>`) |
| `Badge` | `Badge.tsx` | function component | Puro (apenas `<div>`) |
| `Icon` | `Icon.tsx` | function component | Puro (apenas `<span>`) — depende da fonte `Material Symbols Rounded` |
| `LoadingSpinner` | `Loading.tsx` | function component | Puro (apenas `<svg>`) |
| `Skeleton` | `Loading.tsx` | function component | Puro (apenas `<div>`) |
| `FullPageLoading` | `Loading.tsx` | function component | Usa `LoadingSpinner` |

## Fluxo: Renderização do `Button`

```mermaid
flowchart TD
    A[Caller: <Button variant size isLoading ...>children</Button>] --> B{isLoading?}
    B -- true --> C[Render LoadingSpinner size-5]
    B -- false --> D[Render children]
    C --> E[apply cn base classes]
    D --> E
    E --> F[merge variant classes]
    F --> G[merge size classes]
    G --> H[merge user className]
    H --> I[twMerge resolve conflicts]
    I --> J[disabled = isLoading OR props.disabled]
    J --> K[Render <button> with final classes]
```

## Fluxo: Renderização do `Icon` (Material Symbols)

```mermaid
flowchart TD
    A[Caller: <Icon name weight grade opticalSize fill className />] --> B[Build fontVariationSettings]
    B --> C["FILL = fill ? 1 : 0"]
    C --> D["wght = weight (default 400)"]
    D --> E["GRAD = grade (default 0)"]
    E --> F["opsz = opticalSize (default 24)"]
    F --> G[apply cn base = 'material-symbols-rounded select-none']
    G --> H[merge user className]
    H --> I[Render <span aria-hidden='true'>name</span>]
```

## Fluxo: Composição do `FullPageLoading`

```mermaid
flowchart TD
    A[Caller: <FullPageLoading />] --> B[Render fixed overlay div]
    B --> C["className: fixed inset-0 z-100 flex items-center justify-center bg-background/80 backdrop-blur-sm"]
    C --> D[Render LoadingSpinner]
    D --> E["className: size-12 text-primary"]
```

## Fluxo: Utilitário `cn(...)` (lib/utils.ts)

```mermaid
flowchart LR
    A[cn inputs: ClassValue] --> B[clsx inputs: resolve conditionals, arrays, objects]
    B --> C[twMerge result: resolve Tailwind conflicts]
    C --> D[Return final className string]
```

## Hierarquia de composição

```mermaid
graph TD
    Button --> LoadingSpinner
    FullPageLoading --> LoadingSpinner
    Button --> cn[cn utility]
    Card --> cn
    Input --> cn
    Badge --> cn
    Icon --> cn
    LoadingSpinner --> cn
    Skeleton --> cn
    cn --> clsx[clsx: conditional join]
    cn --> twMerge[twMerge: Tailwind conflict resolution]
```

## Sistema de variantes — Tabela consolidada

```mermaid
graph LR
    subgraph Button
        BV[variant: primary, secondary, ghost, outline]
        BS[size: sm, md, lg, icon]
    end
    subgraph Badge
        BdV[variant: primary, secondary, outline, ghost]
    end
    subgraph Card
        CFlag[hoverable: boolean]
    end
    subgraph Icon
        IFill[fill: boolean]
        IW[weight: number]
        IG[grade: number]
        IO[opticalSize: number]
    end
```

## Notas de design

- 🟢 **Padrão `forwardRef`**: Button, Card e Input expõem `ref` para que consumers possam anexar referências DOM (essencial para integração com bibliotecas de form/animação).
- 🟢 **`cn` (clsx + tailwind-merge)**: padrão idiomático shadcn/ui — permite ao caller fazer override de classes sem conflito (`twMerge` resolve `px-4` vs `px-8` automaticamente).
- 🟢 **Material Symbols Rounded**: dependência externa da fonte (carregada no `frontend/src/app/layout.tsx`, não neste módulo). Componente só assume que a fonte está presente.
- 🟡 **`Icon` como `<span>` com `aria-hidden`**: a fonte Material Symbols renderiza glyphs via ligatures (`<span class="material-symbols-rounded">search</span>`). Sem `aria-hidden` ou label externa, este ícone é invisível para leitores de tela. Aceitável quando usado dentro de botão com texto, mas o caller é responsável pela acessibilidade.
- 🟡 **Sem testes unitários detectados** no diretório `frontend/src/components/ui/` — esses componentes são testados implicitamente via testes das features que os consomem.
