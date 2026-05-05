# Backend Missing Accounts Module Bugfix Design

## Overview

O backend Django falha ao iniciar no ambiente de staging com `ModuleNotFoundError: No module named 'accounts'` porque o Dockerfile.production não copia o diretório `accounts` para a imagem do container. A estratégia de correção é simples e direta: adicionar uma instrução COPY para incluir o diretório `accounts` junto com os outros módulos da aplicação (`config` e `podcasts`). Esta é uma correção de baixo risco que apenas adiciona um diretório que deveria estar presente desde o início.

## Glossary

- **Bug_Condition (C)**: A condição que dispara o bug - quando o Docker build executa e não copia o diretório `accounts` para o container
- **Property (P)**: O comportamento desejado - o diretório `accounts` deve ser copiado para o container e o Django deve iniciar sem erros de módulo faltante
- **Preservation**: O comportamento existente de cópia dos diretórios `config` e `podcasts` que deve permanecer inalterado
- **accounts**: O módulo Django em `backend/accounts/` que define o modelo de usuário customizado (`AUTH_USER_MODEL = "accounts.User"`)
- **Dockerfile.production**: O arquivo em `backend/Dockerfile.production` que define como a imagem Docker de produção/staging é construída
- **INSTALLED_APPS**: A lista em `config/settings.py` que declara todos os módulos Django que devem ser carregados na aplicação

## Bug Details

### Bug Condition

O bug se manifesta quando o Docker build executa o Dockerfile.production e não inclui o diretório `accounts` nas instruções COPY, resultando em um container sem o módulo `accounts` que é crítico para a aplicação (define o modelo de usuário customizado).

**Formal Specification:**
```
FUNCTION isBugCondition(dockerBuild)
  INPUT: dockerBuild of type DockerBuildExecution
  OUTPUT: boolean
  
  RETURN dockerBuild.dockerfile == "Dockerfile.production"
         AND "accounts" IN dockerBuild.settings.INSTALLED_APPS
         AND "accounts" NOT IN dockerBuild.copiedDirectories
         AND dockerBuild.startupAttempt RESULTS IN ModuleNotFoundError
END FUNCTION
```

### Examples

- **Exemplo 1**: Build da imagem Docker → Gunicorn tenta iniciar → Crash com `ModuleNotFoundError: No module named 'accounts'` (comportamento atual incorreto)
- **Exemplo 2**: Build da imagem Docker → Gunicorn tenta iniciar → Django carrega `accounts` de INSTALLED_APPS → Sucesso (comportamento esperado após correção)
- **Exemplo 3**: Container inicia no staging → Healthcheck falha → 502 Bad Gateway no Nginx (comportamento atual incorreto)
- **Exemplo 4**: Container inicia no staging → Healthcheck passa → Aplicação responde normalmente (comportamento esperado após correção)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- A cópia do diretório `config` deve continuar funcionando exatamente como antes
- A cópia do diretório `podcasts` deve continuar funcionando exatamente como antes
- A cópia dos arquivos `manage.py`, `pyproject.toml`, e `pytest.ini` deve continuar funcionando
- O comando `collectstatic` deve continuar executando sem erros
- A configuração de healthcheck, usuário app, e CMD do Gunicorn devem permanecer inalteradas

**Scope:**
Todas as instruções do Dockerfile que NÃO envolvem a cópia do diretório `accounts` devem ser completamente inalteradas por esta correção. Isso inclui:
- Estágio builder (instalação de dependências com UV)
- Estágio runtime (configuração do ambiente)
- Variáveis de ambiente
- Configuração do usuário app
- Comando de inicialização do Gunicorn

## Hypothesized Root Cause

Baseado na descrição do bug, a causa raiz é clara e direta:

1. **Omissão na Lista de COPY**: O Dockerfile.production foi criado com instruções COPY apenas para `config` e `podcasts`, mas o desenvolvedor esqueceu de adicionar `accounts` na lista, apesar de estar em INSTALLED_APPS

2. **Falta de Validação no Build**: O comando `collectstatic` executa com `|| true`, o que mascara erros potenciais durante o build que poderiam ter detectado o módulo faltante

3. **Teste Insuficiente**: A imagem Docker não foi testada adequadamente antes do deploy para staging, permitindo que um container sem o módulo crítico `accounts` fosse implantado

4. **Dependência Crítica Não Documentada**: O módulo `accounts` é especialmente crítico porque define `AUTH_USER_MODEL`, mas isso não estava explícito na ordem das instruções COPY

## Correctness Properties

Property 1: Bug Condition - Accounts Module Copied to Container

_For any_ Docker build execution where the Dockerfile.production is used and `accounts` is listed in INSTALLED_APPS, the build process SHALL copy the `accounts` directory into the container filesystem, allowing Django to successfully import the module during startup.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Existing COPY Instructions Unchanged

_For any_ Docker build execution where the Dockerfile.production is used, the build process SHALL continue to copy the `config` and `podcasts` directories exactly as before, preserving all existing module loading behavior for these directories.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

A causa raiz está confirmada pela análise do Dockerfile.production. A correção é direta:

**File**: `backend/Dockerfile.production`

**Location**: Linha 40 (após a linha `COPY --chown=app:app podcasts ./podcasts`)

**Specific Changes**:
1. **Add COPY Instruction for accounts**: Adicionar uma nova linha COPY para incluir o diretório `accounts`
   - Inserir: `COPY --chown=app:app accounts ./accounts`
   - Posição: Após a linha que copia `podcasts`, antes da linha `ENV PYTHONDONTWRITEBYTECODE=1`
   - Usar o mesmo padrão de ownership (`--chown=app:app`) das outras instruções COPY

2. **Maintain Consistency**: Garantir que a nova linha segue o mesmo padrão das linhas existentes
   - Mesmo formato: `COPY --chown=app:app <source> ./<destination>`
   - Mesma indentação e estilo

3. **No Other Changes**: Não modificar nenhuma outra linha do Dockerfile
   - Manter todas as outras instruções COPY inalteradas
   - Manter configurações de ENV, USER, HEALTHCHECK, e CMD inalteradas

**Resultado Esperado**:
```dockerfile
COPY --chown=app:app manage.py pyproject.toml pytest.ini ./
COPY --chown=app:app config ./config
COPY --chown=app:app podcasts ./podcasts
COPY --chown=app:app accounts ./accounts  # ← NOVA LINHA
```

## Testing Strategy

### Validation Approach

A estratégia de teste segue uma abordagem em duas fases: primeiro, confirmar que o bug existe na imagem atual (exploratory), depois verificar que a correção funciona e preserva o comportamento existente.

### Exploratory Bug Condition Checking

**Goal**: Confirmar que o bug existe na imagem Docker atual ANTES de implementar a correção. Verificar que o módulo `accounts` está realmente ausente e causa o crash do Gunicorn.

**Test Plan**: Construir a imagem Docker atual (sem a correção), tentar iniciar o container, e observar o erro `ModuleNotFoundError`. Inspecionar o filesystem do container para confirmar que o diretório `accounts` está ausente.

**Test Cases**:
1. **Build Current Image**: Executar `docker build -f backend/Dockerfile.production -t test-unfixed .` (deve completar com sucesso)
2. **Inspect Container Filesystem**: Executar `docker run --rm test-unfixed ls -la /app` e verificar que `accounts/` NÃO está presente (confirmará o bug)
3. **Attempt Container Startup**: Executar `docker run --rm -e DJANGO_SECRET_KEY=test test-unfixed` e observar crash com `ModuleNotFoundError: No module named 'accounts'` (confirmará o bug)
4. **Check Gunicorn Logs**: Verificar que os logs mostram o erro durante a importação de INSTALLED_APPS (confirmará a causa raiz)

**Expected Counterexamples**:
- O diretório `/app/accounts` não existe no container
- Gunicorn falha ao iniciar com `ModuleNotFoundError: No module named 'accounts'`
- O erro ocorre durante a fase de importação dos módulos em INSTALLED_APPS

### Fix Checking

**Goal**: Verificar que para todas as execuções de build onde a correção está aplicada, o módulo `accounts` é copiado e o Django inicia com sucesso.

**Pseudocode:**
```
FOR ALL dockerBuild WHERE isBugCondition(dockerBuild_unfixed) DO
  dockerBuild_fixed := applyFix(dockerBuild)
  ASSERT "accounts" IN dockerBuild_fixed.copiedDirectories
  ASSERT dockerBuild_fixed.startupAttempt == SUCCESS
  ASSERT NO ModuleNotFoundError IN dockerBuild_fixed.logs
END FOR
```

**Test Cases**:
1. **Build Fixed Image**: Executar `docker build -f backend/Dockerfile.production -t test-fixed .` com a correção aplicada
2. **Verify accounts Directory Present**: Executar `docker run --rm test-fixed ls -la /app/accounts` e confirmar que o diretório existe
3. **Verify Successful Startup**: Executar `docker run --rm -e DJANGO_SECRET_KEY=test -e DATABASE_URL=sqlite:///db.sqlite3 test-fixed` e confirmar que Gunicorn inicia sem erros
4. **Verify Module Import**: Executar `docker run --rm -e DJANGO_SECRET_KEY=test -e DATABASE_URL=sqlite:///db.sqlite3 test-fixed python manage.py check` e confirmar que não há erros de módulo faltante

### Preservation Checking

**Goal**: Verificar que para todas as instruções do Dockerfile que NÃO envolvem `accounts`, o comportamento permanece exatamente o mesmo após a correção.

**Pseudocode:**
```
FOR ALL dockerInstruction WHERE dockerInstruction != "COPY accounts" DO
  ASSERT dockerBuild_original(dockerInstruction) = dockerBuild_fixed(dockerInstruction)
END FOR
```

**Testing Approach**: Comparação direta do filesystem e comportamento do container é recomendada porque:
- É uma mudança simples e isolada (apenas uma linha COPY adicionada)
- Podemos comparar o conteúdo dos diretórios `config` e `podcasts` antes e depois
- Podemos verificar que os comandos existentes (collectstatic, gunicorn) continuam funcionando

**Test Plan**: Construir ambas as imagens (antes e depois da correção, mas com `accounts` copiado manualmente na versão "antes" para permitir startup), e comparar o comportamento de todos os componentes não relacionados a `accounts`.

**Test Cases**:
1. **Config Directory Preservation**: Verificar que `/app/config` tem o mesmo conteúdo em ambas as imagens
2. **Podcasts Directory Preservation**: Verificar que `/app/podcasts` tem o mesmo conteúdo em ambas as imagens
3. **Static Files Collection**: Verificar que `collectstatic` continua executando sem erros e produz os mesmos arquivos estáticos
4. **Gunicorn Configuration**: Verificar que o comando Gunicorn inicia com os mesmos parâmetros (workers, timeout, bind)
5. **Environment Variables**: Verificar que as variáveis de ambiente (PYTHONDONTWRITEBYTECODE, PYTHONUNBUFFERED, DJANGO_SETTINGS_MODULE) permanecem inalteradas
6. **User and Permissions**: Verificar que o usuário `app` e as permissões dos arquivos permanecem inalteradas

### Unit Tests

- Testar que o build do Docker completa sem erros com a correção aplicada
- Testar que o diretório `accounts` está presente no filesystem do container
- Testar que o Django consegue importar o módulo `accounts` sem erros
- Testar que o modelo `accounts.User` está acessível (validando AUTH_USER_MODEL)

### Property-Based Tests

Não aplicável para este bugfix específico, pois:
- A correção é uma mudança de infraestrutura (Dockerfile), não de código Python
- O comportamento é determinístico (ou o diretório é copiado ou não)
- Testes de integração e inspeção do container são mais apropriados

### Integration Tests

- Testar o fluxo completo: build da imagem → start do container → healthcheck passa → aplicação responde a requests
- Testar que o endpoint `/health/` retorna 200 OK após o container iniciar
- Testar que o admin do Django (`/admin/`) carrega corretamente (depende do modelo User de accounts)
- Testar que a autenticação JWT funciona (depende do modelo User de accounts)
- Testar o deploy completo no ambiente de staging após a correção
