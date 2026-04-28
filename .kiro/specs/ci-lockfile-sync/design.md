# CI Lockfile Sync Bugfix Design

## Overview

O `package-lock.json` no diretório `frontend` está fora de sincronia com o `package.json`, causando falha no CI ao executar `npm ci`. A correção consiste em regenerar o `package-lock.json` via `npm install` para que ele reflita exatamente as dependências declaradas no `package.json`, restaurando a capacidade do CI de instalar dependências com sucesso.

## Glossary

- **Bug_Condition (C)**: A condição que dispara o bug — quando o `package-lock.json` não contém todas as dependências declaradas no `package.json`
- **Property (P)**: O comportamento desejado — `npm ci` executa sem erros de sincronia e instala todas as dependências corretamente
- **Preservation**: O comportamento existente que não deve ser alterado pela correção — instalação local via `npm install`, etapas subsequentes do CI (build, testes, lint) e outros diretórios do projeto
- **npm ci**: Comando que instala dependências estritamente a partir do lockfile; falha se o lockfile estiver fora de sincronia com o `package.json`
- **package-lock.json**: Arquivo gerado pelo npm que registra a árvore exata de dependências resolvidas
- **lockfileVersion**: Versão do formato do lockfile (atualmente 3 no projeto)

## Bug Details

### Bug Condition

O bug se manifesta quando o CI executa `npm ci` no diretório `frontend`. O `package-lock.json` não contém a entrada para `@next/bundle-analyzer`, que está declarada como devDependency no `package.json`. O `npm ci` detecta essa divergência e aborta com `EUSAGE`.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input = { packageJson: object, packageLockJson: object }
  OUTPUT: boolean

  allDeclared := keys(input.packageJson.dependencies)
                 UNION keys(input.packageJson.devDependencies)

  allLocked := keys(input.packageLockJson.packages[""].dependencies)
               UNION keys(input.packageLockJson.packages[""].devDependencies)

  RETURN NOT (allDeclared SUBSET_OF allLocked)
END FUNCTION
```

### Examples

- **Caso atual**: `package.json` declara `"@next/bundle-analyzer": "^16.2.3"` em `devDependencies`, mas `package-lock.json` não possui nenhuma entrada para `@next/bundle-analyzer` → `npm ci` falha com `EUSAGE`
- **Caso corrigido**: após `npm install`, `package-lock.json` passa a conter `node_modules/@next/bundle-analyzer` com versão resolvida → `npm ci` instala com sucesso
- **Caso sem bug**: todas as outras dependências (`next`, `react`, `vitest`, etc.) já estão presentes no lockfile → `npm ci` as instala corretamente
- **Edge case**: se `package.json` for modificado novamente sem atualizar o lockfile → o bug reaparece; o CI deve sempre executar `npm ci` (não `npm install`) para detectar divergências

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Instalação local de dependências via `npm install` no diretório `frontend` deve continuar funcionando corretamente
- Etapas subsequentes do CI após a instalação (build, testes, lint) devem continuar executando normalmente
- Outros diretórios do projeto devem continuar funcionando de forma independente, sem impacto

**Scope:**
Todos os inputs que NÃO envolvem a divergência entre `package.json` e `package-lock.json` devem ser completamente inalterados por esta correção. Isso inclui:
- Execução de `npm install` localmente
- Scripts de build (`next build`), testes (`vitest run`) e lint (`eslint`)
- Pipelines de CI de outros diretórios do projeto

## Hypothesized Root Cause

Com base na análise do bug, a causa mais provável é:

1. **Dependência adicionada sem atualizar o lockfile**: `@next/bundle-analyzer` foi adicionado ao `package.json` manualmente (ou via editor) sem executar `npm install` em seguida, portanto o lockfile nunca foi regenerado para incluir essa dependência e suas transitivas.

2. **Lockfile não commitado após atualização**: Alternativamente, `npm install` foi executado localmente mas o `package-lock.json` atualizado não foi incluído no commit, resultando em um lockfile desatualizado no repositório.

3. **Conflito de merge não resolvido corretamente**: Um merge entre branches pode ter restaurado uma versão antiga do `package-lock.json` sem a entrada de `@next/bundle-analyzer`.

A causa mais provável é a **#1**, dado que a entrada raiz do lockfile (`packages[""]`) não contém `@next/bundle-analyzer` em `devDependencies`, indicando que o lockfile nunca foi regenerado após a adição da dependência.

## Correctness Properties

Property 1: Bug Condition - Lockfile Sincronizado com package.json

_For any_ par `(package.json, package-lock.json)` onde a condição de bug se aplica (isBugCondition retorna true), após a correção o `package-lock.json` regenerado SHALL conter entradas para todas as dependências declaradas no `package.json`, permitindo que `npm ci` execute sem erros.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation - Comportamento Existente Inalterado

_For any_ input que NÃO envolva a divergência do lockfile (isBugCondition retorna false), o comportamento do projeto SHALL permanecer idêntico ao original, preservando instalação local, build, testes, lint e pipelines de outros diretórios.

**Validates: Requirements 3.1, 3.2, 3.3**

## Fix Implementation

### Changes Required

Assumindo que a causa raiz é a ausência de `@next/bundle-analyzer` no lockfile:

**Diretório**: `frontend/`

**Arquivo**: `frontend/package-lock.json`

**Specific Changes**:

1. **Regenerar o lockfile**: Executar `npm install` no diretório `frontend` para que o npm resolva todas as dependências declaradas no `package.json` e atualize o `package-lock.json` com as entradas faltantes.
   - O comando deve ser executado com a mesma versão do Node.js usada no CI (ver `frontend/.nvmrc`)
   - Após a execução, `package-lock.json` conterá `@next/bundle-analyzer` e suas dependências transitivas

2. **Commitar o lockfile atualizado**: O `package-lock.json` regenerado deve ser commitado no repositório para que o CI passe a usar a versão sincronizada.

3. **Verificar a sincronização**: Após o commit, executar `npm ci` localmente para confirmar que não há mais erros de sincronia antes de abrir o PR.

## Testing Strategy

### Validation Approach

A estratégia de testes segue uma abordagem em duas fases: primeiro, confirmar o bug no código não corrigido; depois, verificar que a correção funciona e que o comportamento existente é preservado.

### Exploratory Bug Condition Checking

**Goal**: Confirmar o bug ANTES de implementar a correção. Verificar a causa raiz identificada.

**Test Plan**: Verificar diretamente a divergência entre `package.json` e `package-lock.json` inspecionando os arquivos, e executar `npm ci` no código não corrigido para observar a falha.

**Test Cases**:
1. **Verificação de divergência**: Comparar as chaves de `devDependencies` em `package.json` com as entradas em `packages[""].devDependencies` do `package-lock.json` — `@next/bundle-analyzer` estará ausente no lockfile (confirma o bug)
2. **Execução de npm ci**: Executar `npm ci` no diretório `frontend` com o lockfile atual — falhará com `EUSAGE` (confirma o bug)
3. **Busca no lockfile**: Pesquisar por `bundle-analyzer` no `package-lock.json` — nenhum resultado encontrado (confirma a causa raiz)

**Expected Counterexamples**:
- `npm ci` falha com `npm error code EUSAGE` indicando que `package.json` e `package-lock.json` estão fora de sincronia
- Causa confirmada: `@next/bundle-analyzer` presente em `package.json` mas ausente em `package-lock.json`

### Fix Checking

**Goal**: Verificar que, após a correção, `npm ci` executa com sucesso para todos os inputs onde a condição de bug se aplica.

**Pseudocode:**
```
FOR ALL (packageJson, packageLockJson) WHERE isBugCondition(packageJson, packageLockJson) DO
  regenerate packageLockJson via npm install
  result := npm_ci(packageLockJson)
  ASSERT result.exitCode == 0
  ASSERT allDeclared(packageJson) SUBSET_OF allLocked(packageLockJson)
END FOR
```

### Preservation Checking

**Goal**: Verificar que, para todos os inputs onde a condição de bug NÃO se aplica, o comportamento permanece idêntico ao original.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT behavior_original(input) == behavior_fixed(input)
END FOR
```

**Testing Approach**: Testes de preservação são recomendados aqui porque:
- Garantem que etapas subsequentes do CI (build, testes, lint) continuam funcionando
- Verificam que outros diretórios do projeto não foram afetados
- Confirmam que `npm install` local continua funcionando corretamente

**Test Cases**:
1. **Preservação do build**: Verificar que `npm run build` continua executando com sucesso após a atualização do lockfile
2. **Preservação dos testes**: Verificar que `npm test` (vitest run) continua passando após a atualização do lockfile
3. **Preservação do lint**: Verificar que `npm run lint` continua executando sem erros após a atualização do lockfile
4. **Preservação de outros diretórios**: Verificar que outros diretórios do projeto não foram impactados pela mudança no lockfile do `frontend`

### Unit Tests

- Verificar que `package-lock.json` contém entrada para `@next/bundle-analyzer` após a correção
- Verificar que a versão resolvida de `@next/bundle-analyzer` é compatível com a constraint `^16.2.3` do `package.json`
- Verificar que `npm ci` retorna exit code 0 após a correção

### Property-Based Tests

- Para qualquer conjunto de dependências declaradas em `package.json`, o `package-lock.json` gerado por `npm install` deve conter entradas para todas elas
- Para qualquer `package-lock.json` sincronizado, `npm ci` deve instalar com sucesso sem erros de sincronia
- Para qualquer modificação no `package.json` seguida de `npm install`, o lockfile resultante deve satisfazer `isBugCondition == false`

### Integration Tests

- Executar o pipeline completo de CI (`npm ci` → `npm run build` → `npm test` → `npm run lint`) com o lockfile corrigido e verificar que todas as etapas passam
- Verificar que o ambiente de CI usa a mesma versão do Node.js especificada em `frontend/.nvmrc` para garantir consistência
- Verificar que o lockfile commitado no repositório é idêntico ao gerado localmente com a mesma versão do Node.js
