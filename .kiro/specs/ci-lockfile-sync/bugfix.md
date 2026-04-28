# Bugfix Requirements Document

## Introduction

O `package-lock.json` no diretório `frontend` está fora de sincronia com o `package.json`. Isso causa falha no CI ao executar `npm ci`, que exige que os dois arquivos estejam em sincronia. O erro impede que pull requests passem na etapa de instalação de dependências do pipeline.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN o CI executa `npm ci` no diretório `frontend` THEN o sistema falha com o erro `npm error code EUSAGE` indicando que `package.json` e `package-lock.json` estão fora de sincronia
1.2 WHEN o `package-lock.json` não reflete as dependências declaradas no `package.json` THEN o sistema rejeita a instalação e interrompe o pipeline de CI

### Expected Behavior (Correct)

2.1 WHEN o CI executa `npm ci` no diretório `frontend` THEN o sistema SHALL instalar as dependências com sucesso sem erros de sincronia
2.2 WHEN o `package-lock.json` é atualizado para refletir o estado atual do `package.json` THEN o sistema SHALL completar a etapa de instalação de dependências no CI sem falhas

### Unchanged Behavior (Regression Prevention)

3.1 WHEN as dependências do `frontend` são instaladas localmente com `npm install` THEN o sistema SHALL CONTINUE TO instalar os pacotes corretamente
3.2 WHEN o CI executa etapas subsequentes após a instalação (build, testes, lint) THEN o sistema SHALL CONTINUE TO executar essas etapas normalmente
3.3 WHEN outros diretórios do projeto executam seus próprios passos de CI THEN o sistema SHALL CONTINUE TO funcionar de forma independente e sem impacto
