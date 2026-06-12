# frontend-ui, Contratos

> Spec gerada pelo Redator em 2026-06-06
> `doc_level` = `completo`
> Contratos externos da unit `frontend-ui` (design system).
> **Esta unit não expõe contrato HTTP/fila/RPC externo.** Este arquivo documenta os contratos internos (props TypeScript) que outros módulos do frontend consomem.

**Escala de confiança:** 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## Visão geral

A unit `frontend-ui` é um **módulo puramente de apresentação** que vive 100% no bundle do cliente Next.js. Ela:

- ❌ Não expõe endpoints HTTP
- ❌ Não consome endpoints HTTP
- ❌ Não publica nem consome mensagens de filas (Celery, SQS, etc.)
- ❌ Não define RPC ou gRPC services
- ❌ Não persiste dados (sem localStorage, sem cookies, sem IndexedDB)
- ❌ Não emite eventos de domínio

Os **contratos desta unit são apenas as assinaturas TypeScript dos componentes e utilitários** — interfaces `Props` que o type-checker do TypeScript valida em tempo de compilação. Eles são "contratos" no sentido de que definem o que outros módulos do frontend podem ou não fazer ao consumir esta unit.

---

## Por que `contracts.md` foi gerado mesmo assim

O `doc_level = completo` indica que **toda unit deve ter um arquivo `contracts.md`**. Quando a unit não expõe contrato externo, o arquivo cumpre dois papéis:

1. **Documentação dos contratos internos** (props TypeScript + tipos exportados) que outros módulos do frontend precisam respeitar.
2. **Declaração formal de ausência** de contratos HTTP/fila/RPC — para que auditorias futuras não procurem endpoints inexistentes.

---

## Contratos externos: `n/a`

| Tipo | Quantidade | Observação |
|------|-----------|------------|
| Endpoints HTTP | 0 | Nenhuma rota exposta ou consumida |
| Filas (Celery/RQ/SQS) | 0 | Sem publicação ou consumo de mensagens |
| RPC / gRPC | 0 | Sem serviços remotos |
| WebSockets | 0 | Sem comunicação persistente |
| Webhooks | 0 | Sem endpoints de callback |
| Storage cliente | 0 | Sem localStorage, sessionStorage, IndexedDB, cookies |

🟢 **Confirmação por inspeção do código:** todos os arquivos em `frontend/src/components/ui/` (Button, Card, Input, Badge, Icon, Loading) são funções puras ou `forwardRef` que recebem props e retornam JSX. O arquivo `frontend/src/lib/utils.ts` exporta apenas funções puras (`cn`, `formatDuration`, `formatDate`) sem side effects.

---

## Contratos internos: assinaturas TypeScript exportadas

Estes são os **tipos públicos** que outros módulos do frontend podem importar. Mudanças incompatíveis aqui são breaking changes para todo o app.

### 1. `Button` (componente + props)

```ts
import { Button, ButtonProps } from '@/components/ui/Button';

// ButtonProps
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';   // default 'primary'
  size?: 'sm' | 'md' | 'lg' | 'icon';                        // default 'md'
  isLoading?: boolean;
}

// ForwardRefExoticComponent<ButtonProps & RefAttributes<HTMLButtonElement>>
```

**Contrato de uso:**
- Caller DEVE tratar `Button` como `forwardRef` — pode passar `ref` para acessar o `<button>` DOM.
- Caller PODE passar qualquer `ButtonHTMLAttributes` adicional (`onClick`, `onFocus`, `aria-*`, `data-*`, etc.) via spread.
- Caller NÃO DEVE sobrescrever a prop `className` pensando que ela substitui as classes do design system — `cn()` faz merge, mas a última classe vence em conflitos Tailwind.
- Quando `isLoading=true`, `children` é **ignorado** (substituído por `LoadingSpinner`). Caller não deve passar conteúdo esperando que ele apareça junto com o spinner.

**Exemplo válido:**
```tsx
<Button variant="primary" size="md" onClick={handleSave} isLoading={saving}>
  Salvar
</Button>
```

**Exemplo inválido (quebra contrato):**
```tsx
<Button variant="primary" size="md" type="button">
  {/* Conteúdo que depende de aparecer junto com isLoading */}
</Button>
```

---

### 2. `Card` (componente + props)

```ts
import { Card, CardProps } from '@/components/ui/Card';

// CardProps
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;  // default false
}

// ForwardRefExoticComponent<CardProps & RefAttributes<HTMLDivElement>>
```

**Contrato de uso:**
- Caller PODE usar `Card` como container genérico (`<Card>...</Card>`).
- Caller DEVE usar `hoverable={true}` APENAS quando o Card for interativo (link, botão interno, etc.) — efeito é cosmético e não tem `:focus-visible`.
- Caller NÃO DEVE esperar suporte a `href` ou `onClick` direto no `Card` — wrap em `<Link>` ou adicione `onClick` + `role="button"` se necessário.

---

### 3. `Input` (componente + props)

```ts
import { Input, InputProps } from '@/components/ui/Input';

// InputProps = InputHTMLAttributes<HTMLInputElement>
// ForwardRefExoticComponent<InputProps & RefAttributes<HTMLInputElement>>
```

**Contrato de uso:**
- Caller PODE passar qualquer atributo de `<input>` HTML padrão (`type`, `value`, `placeholder`, `onChange`, `required`, `pattern`, `min`, `max`, etc.).
- Caller DEVE usar com forwardRef para integração com libs de form (RHF, Formik) que precisam de `ref`.
- Caller NÃO DEVE esperar suporte nativo a `<label>` — wrap em `<label>` ou use `aria-label` / `aria-labelledby`.

---

### 4. `Badge` (componente + props)

```ts
import { Badge, BadgeProps } from '@/components/ui/Badge';

// BadgeProps
interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';  // default 'primary'
}

// FunctionComponent<BadgeProps>
```

**Contrato de uso:**
- `Badge` NÃO é `forwardRef` — caller não pode passar `ref`.
- Caller PODE usar como `<span>` decorativo com semântica de "etiqueta".
- Caller NÃO DEVE aninhar interatividade dentro de Badge sem adicionar `role` e event handlers explícitos.

---

### 5. `Icon` (componente + props)

```ts
import { Icon, IconProps } from '@/components/ui/Icon';

// IconProps
interface IconProps extends HTMLAttributes<HTMLSpanElement> {
  name: string;            // obrigatório — ligature Material Symbols
  fill?: boolean;          // default false
  weight?: number;         // default 400
  grade?: number;          // default 0
  opticalSize?: number;    // default 24
}

// FunctionComponent<IconProps>
```

**Contrato de uso:**
- Caller DEVE fornecer `name` (string ligature) — sem default.
- Caller PODE customizar peso (`weight`), grade, optical size, e fill via props.
- Caller É RESPONSÁVEL por acessibilidade: `Icon` é `aria-hidden='true'` por padrão. Se o ícone for o único conteúdo informativo, envolva em `<button aria-label="...">` ou adicione label visual adjacente.
- Caller NÃO DEVE esperar validação de que `name` existe na fonte `Material Symbols Rounded` — typagem fraca.

**Exemplo válido:**
```tsx
<button aria-label="Buscar">
  <Icon name="search" />
</button>
```

**Exemplo que pode falhar a11y:**
```tsx
<button>
  <Icon name="search" />
</button>
{/* Sem aria-label, leitor de tela não anuncia "Buscar" */}
```

---

### 6. `LoadingSpinner` (componente)

```ts
import { LoadingSpinner } from '@/components/ui/Loading';

// FunctionComponent<HTMLAttributes<SVGSVGElement>>
```

**Contrato de uso:**
- Caller PODE passar `className` para customizar tamanho e cor.
- Caller NÃO DEVE esperar que cor seja fixa — `stroke='currentColor'` herda do contexto.
- Caller NÃO DEVE usar para loading de listas longas — preferir `Skeleton`.

---

### 7. `Skeleton` (componente)

```ts
import { Skeleton } from '@/components/ui/Loading';

// FunctionComponent<HTMLAttributes<HTMLDivElement>>
```

**Contrato de uso:**
- Caller DEVE fornecer `className` com tamanho (ex.: `h-20 w-full`) — sem prop `width`/`height`.
- Caller PODE empilhar múltiplos `Skeleton` para simular layout de lista.

---

### 8. `FullPageLoading` (componente)

```ts
import { FullPageLoading } from '@/components/ui/Loading';

// FunctionComponent — sem props
```

**Contrato de uso:**
- Caller NÃO PODE customizar (sem props, sem `className`).
- Caller DEVE usar apenas em transições autenticadas (após login, durante logout, navegação entre áreas autenticadas).
- Caller DEVE considerar que cobre a viewport inteira (`fixed inset-0 z-[100]`) — qualquer modal/tooltip com z>100 vai ficar acima (decisão consciente, mas documentar convenção).

---

### 9. `cn` (utilitário)

```ts
import { cn } from '@/lib/utils';

function cn(...inputs: ClassValue[]): string;
```

**Contrato de uso:**
- Caller PODE passar qualquer combinação de strings, condicionais, arrays, ou objetos.
- Caller PODE confiar que conflitos Tailwind são resolvidos (último vence).
- Caller NÃO DEVE usar como substituto de `JSON.stringify` ou template literal — não é um join genérico.

---

### 10. `formatDuration` (utilitário)

```ts
import { formatDuration } from '@/lib/utils';

function formatDuration(seconds: number): string;
```

**Contrato:**
- Input `0`, `NaN`, `null`, `undefined` → output `'0:00'` (sentinela).
- Input `< 3600` → output `M:SS`.
- Input `>= 3600` → output `H:MM:SS`.

---

### 11. `formatDate` (utilitário)

```ts
import { formatDate } from '@/lib/utils';

function formatDate(date: string | Date): string;
```

**Contrato:**
- Input `null`/`undefined`/`''` → output `''` (sentinela).
- Input ISO string ou `Date` → output formatado PT-BR curto (`'15 de mar. de 2025'`).
- ⚠️ Gotcha: input `0` (timestamp numérico/epoch) é falsy → output `''`. Caller deve passar string ISO ou `Date`.

---

## Convenções de composição

Quando os primitivos são compostos, há contratos implícitos:

- **`Button.isLoading=true` + conteúdo com texto:** texto é substituído por `LoadingSpinner`. Caller não deve esperar ambos visíveis.
- **`Card.hoverable` + `<Link>` interno:** foco de teclado não é gerenciado (sem `:focus-visible` no Card). Caller deve adicionar estilos de focus no `Link`.
- **`Input` dentro de form sem `<label>`:** validação de form funciona, mas leitor de tela não anuncia o campo. Caller deve usar `<label>` ou `aria-label`.
- **Tema dark sem `ThemeProvider`:** classes `dark:` ficam inertes. Caller não deve confiar em dark mode sem garantir que o `ThemeProvider` está no layout.
- **Fonte `Material Symbols` não carregada:** `Icon` renderiza ligature literal. Caller não deve esperar fallback in-module.

---

## Versionamento e breaking changes

Como esta unit vive no mesmo monorepo (frontend), versionamento segue o do `package.json` raiz. Mudanças incompatíveis nas props TypeScript são detectadas em tempo de compilação:

- Adicionar prop opcional: ✅ não-breaking.
- Renomear prop: ❌ breaking (TypeScript erro em todos os callers).
- Mudar tipo de prop: ❌ breaking.
- Adicionar novo valor a union (`variant: 'new-variant'`): ⚠️ pode ser não-breaking se callers passarem `variant?: ...` (TypeScript permite ampliar union em tipos opcionais).
- Remover componente: ❌ breaking.

🟡 **Recomendação:** ao introduzir breaking change, publicar changelog no `package.json` ou em `.specs/CHANGELOG.md` (se o projeto usar).

---

## Lacunas e ressalvas

- 🟡 **R-UI-L2** — `Icon.name: string` é tipagem fraca. Não há autocomplete nem validação em compile-time. Reimplementação futura deve considerar union type gerada de typings oficiais.
- 🟡 **R-UI-L12** — Ordem de spread em `Icon` pode impedir caller de sobrescrever `aria-hidden`. Verificar fix na reimplementação.
- 🟡 **R-UI-L3** — `formatDate` fixo em PT-BR. Sem suporte multi-idioma. Reimplementação deve aceitar `locale` opcional.
- 🟡 **R-UI-L4** — `z-[100]` (arbitrary) em `FullPageLoading` sem convenção documentada em código. Reimplementação deve extrair constante `Z_INDEX.LOADING_OVERLAY = 100`.
- 🟡 **R-UI-L1** — Nenhum teste unitário destes contratos. Validação é implícita via testes de feature.

---

> Este arquivo documenta o que existe **hoje**. Contratos não-exportados (componentes internos, helpers privados) ficam fora do escopo — só são relevantes se outros módulos os importarem.
