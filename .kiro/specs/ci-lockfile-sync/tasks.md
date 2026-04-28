# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Lockfile Fora de Sincronia com package.json
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Escopo determinístico — verificar que `@next/bundle-analyzer` está declarado em `package.json` mas ausente em `package-lock.json`
  - Ler `frontend/package.json` e coletar todas as chaves de `dependencies` e `devDependencies`
  - Ler `frontend/package-lock.json` e coletar todas as chaves de `packages[""].dependencies` e `packages[""].devDependencies`
  - Verificar que `allDeclared SUBSET_OF allLocked` — a propriedade deve falhar pois `@next/bundle-analyzer` está ausente no lockfile
  - Executar `npm ci` no diretório `frontend` e confirmar que falha com `npm error code EUSAGE`
  - Pesquisar por `bundle-analyzer` no `package-lock.json` e confirmar que nenhum resultado é encontrado
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found: `@next/bundle-analyzer` presente em `package.json` mas ausente em `package-lock.json`; `npm ci` falha com `EUSAGE`
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Comportamento Existente Inalterado
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: `npm install` local no diretório `frontend` instala pacotes corretamente no código não corrigido
  - Observe: `npm run build` (`next build`) executa com sucesso no código não corrigido
  - Observe: `npm test` (`vitest run`) passa no código não corrigido
  - Observe: `npm run lint` executa sem erros no código não corrigido
  - Observe: outros diretórios do projeto funcionam de forma independente
  - Escrever testes de propriedade: para qualquer `package-lock.json` sincronizado (isBugCondition = false), `npm ci` deve instalar com sucesso e as etapas subsequentes (build, testes, lint) devem continuar passando
  - Verificar que os testes passam no código não corrigido (baseline)
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 3. Fix para lockfile fora de sincronia com package.json

  - [x] 3.1 Regenerar o package-lock.json no diretório frontend
    - Verificar a versão do Node.js em `frontend/.nvmrc` e garantir que a mesma versão está ativa localmente
    - Executar `npm install` no diretório `frontend` para resolver todas as dependências declaradas no `package.json` e atualizar o `package-lock.json`
    - Confirmar que `package-lock.json` agora contém a entrada `node_modules/@next/bundle-analyzer` com versão compatível com `^16.2.3`
    - Confirmar que `packages[""].devDependencies` no lockfile inclui `@next/bundle-analyzer`
    - _Bug_Condition: isBugCondition(input) onde NOT (allDeclared SUBSET_OF allLocked) — `@next/bundle-analyzer` ausente no lockfile_
    - _Expected_Behavior: após `npm install`, `package-lock.json` contém todas as dependências declaradas em `package.json`; `npm ci` executa com exit code 0_
    - _Preservation: instalação local via `npm install`, etapas de CI (build, testes, lint) e outros diretórios do projeto permanecem inalterados_
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Lockfile Sincronizado com package.json
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - Verificar que `allDeclared SUBSET_OF allLocked` agora é verdadeiro para o lockfile regenerado
    - Executar `npm ci` no diretório `frontend` e confirmar exit code 0
    - When this test passes, it confirms the expected behavior is satisfied
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Comportamento Existente Inalterado
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Executar `npm install` local e confirmar que continua funcionando corretamente
    - Executar `npm run build` e confirmar que continua passando
    - Executar `npm test` (`vitest run`) e confirmar que continua passando
    - Executar `npm run lint` e confirmar que continua sem erros
    - Confirmar que outros diretórios do projeto não foram impactados
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Checkpoint - Ensure all tests pass
  - Executar o pipeline completo: `npm ci` → `npm run build` → `npm test` → `npm run lint` no diretório `frontend`
  - Confirmar que todas as etapas passam sem erros
  - Verificar que o `package-lock.json` commitado é idêntico ao gerado localmente com a mesma versão do Node.js
  - Ensure all tests pass, ask the user if questions arise.
