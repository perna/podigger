# ADR-006: Material Symbols Rounded como Sistema de Ícones

> Status: Aceito
> Data: 2026-04-04 / 2026-04-09
> Contexto: Commits `2f50d77` ("fix(ui): use rounded material symbol classes to match font") e `ca4dfad` ("fix(frontend): standardize icons on Material Symbols Rounded and fix visibility")

## Contexto e problema

O frontend precisava de um sistema de ícones que:

- Fosse gratuito e bem mantido.
- Tivesse cobertura ampla (>= 2000 glyphs para evitar ficar sem opções).
- Suportasse variações (filled, weight, grade, optical size) para casar com o design system iOS-like.
- Fosse fácil de integrar com Tailwind CSS.

## Decisão

Adotar **Material Symbols Rounded** (fonte variável do Google) com abstração via componente React `<Icon name=... />`.

### Componente

```tsx
// frontend/src/components/ui/Icon.tsx
<span
  className="material-symbols-rounded select-none"
  style={{
    fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${opticalSize}`,
  }}
  aria-hidden="true"
>
  {name}
</span>
```

### Variações expostas

| Prop | Default | Efeito |
|------|---------|--------|
| `name` | (obrigatório) | Ligature da fonte. |
| `fill` | `false` | Outline (`0`) ou filled (`1`). |
| `weight` | `400` | Espessura (100–900). |
| `grade` | `0` | Gradação (0–200). |
| `opticalSize` | `24` | Tamanho óptico (20–48). |

🟢 Fonte: `frontend/src/components/ui/Icon.tsx:15-36`.

### Carregamento da fonte

A fonte `Material Symbols Rounded` é carregada via `<link>` no layout global (presumido; não lido neste extrato, mas evidenciado pelo nome da classe `material-symbols-rounded` exigir a fonte).

## Consequências

### Positivas
- 🟢 **Cobertura ampla** de glyphs (>= 2000), incluindo ícones de podcast (`podcasts`, `headphones`, `multitrack_audio`).
- 🟢 **Fonte variável** = 1 arquivo cobre 4 dimensões de variação.
- 🟢 **Tipagem TypeScript** nas props (sem magic strings).
- 🟢 **Padrão shadcn/ui** consistente com a abstração `<Icon name=... />`.

### Negativas
- 🟡 **`aria-hidden="true"` fixo** — caller é responsável por prover label acessível.
- 🟡 **Dependência da fonte** — se o Google Fonts cair, ícones somem.
- 🟡 **Falha visual silenciosa** — ligatures inválidas aparecem como texto comum, não como espaço em branco.

## Alternativas consideradas

1. **Lucide / Heroicons**: consideradas. Menos glyphs; não tem fonte variável.
2. **Emoticon fallback**: rejeitada. Amador para um app de podcasts.
3. **SVG inline por componente**: rejeitada. Aumentaria o bundle sem ganho claro.

## Histórico

- 🟢 Inicialmente o sistema usava `material-icons` (filled); o commit `2f50d77` corrigiu para `material-symbols-rounded` para casar com a fonte.
- 🟢 O commit `ca4dfad` padronizou todos os ícones para usar `<Icon name=... />`, eliminando Material Symbols diretos em `<span>`.
