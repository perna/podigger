# Staging 502 Bad Gateway Fix - Bugfix Design

## Overview

O erro 502 Bad Gateway em staging é causado por um problema de permissões no arquivo `.env` que impede o Docker Compose de ler variáveis de ambiente necessárias para iniciar os containers de aplicação (backend Django e frontend Next.js). O arquivo `.env` tem permissões `600` (apenas o dono pode ler/escrever) e pertence ao usuário `deploy`, mas o Docker Compose é executado pelo usuário `ubuntu`, que não tem permissão de leitura. Isso resulta no erro "open /opt/podigger-staging/.env: permission denied", fazendo com que apenas os containers de infraestrutura (PostgreSQL e Redis) sejam iniciados, enquanto os containers de aplicação falham silenciosamente.

A estratégia de correção envolve ajustar as permissões do arquivo `.env` para permitir leitura pelo grupo e adicionar o usuário `ubuntu` ao grupo `deploy`, mantendo a segurança adequada sem expor credenciais desnecessariamente.

## Glossary

- **Bug_Condition (C)**: A condição que desencadeia o bug - quando o Docker Compose tenta ler o arquivo `.env` mas o usuário executante não tem permissão de leitura
- **Property (P)**: O comportamento desejado - o Docker Compose deve conseguir ler o arquivo `.env` e iniciar todos os containers com sucesso
- **Preservation**: O comportamento existente de segurança e isolamento entre ambientes (staging e produção) que deve permanecer inalterado pela correção
- **docker-compose.staging.yml**: Arquivo de orquestração que define os serviços do ambiente de staging em `/opt/podigger-staging/`
- **.env**: Arquivo de variáveis de ambiente raiz em `/opt/podigger-staging/.env` que contém `DB_PASSWORD_STAGING` usado pelo Docker Compose para substituição em arquivos `.env.staging`
- **deploy-staging.yml**: Workflow do GitHub Actions em `.github/workflows/deploy-staging.yml` que executa o deploy via SSH como usuário `ubuntu`
- **podigger-nginx-proxy**: Container Nginx que atua como reverse proxy e está na rede `podigger-proxy`

## Bug Details

### Bug Condition

O bug se manifesta quando o GitHub Actions executa o deploy para staging via SSH como usuário `ubuntu`, e o Docker Compose tenta ler o arquivo `/opt/podigger-staging/.env` para obter variáveis de ambiente (como `DB_PASSWORD_STAGING`), mas o arquivo tem permissões `600` e pertence ao usuário `deploy`, impedindo a leitura.

**Formal Specification:**
```
FUNCTION isBugCondition(deployExecution)
  INPUT: deployExecution of type DeploymentContext
  OUTPUT: boolean
  
  RETURN deployExecution.environment == 'staging'
         AND deployExecution.executingUser == 'ubuntu'
         AND deployExecution.envFile.owner == 'deploy'
         AND deployExecution.envFile.permissions == '600'
         AND NOT canRead(deployExecution.executingUser, deployExecution.envFile)
         AND dockerComposeRequiresEnvFile(deployExecution)
END FUNCTION
```

### Examples

- **Exemplo 1 - Deploy Staging Atual (Buggy)**: 
  - Usuário `ubuntu` executa `docker compose -f docker-compose.staging.yml up -d`
  - Docker Compose tenta ler `/opt/podigger-staging/.env` (permissões `600`, dono `deploy`)
  - Erro: "open /opt/podigger-staging/.env: permission denied"
  - Resultado: Apenas `db-staging` e `redis-staging` iniciam; `backend-staging` e `frontend-staging` não iniciam
  - Nginx retorna 502 Bad Gateway porque não consegue resolver os nomes dos containers de aplicação

- **Exemplo 2 - Deploy Staging Esperado (Fixed)**:
  - Usuário `ubuntu` (membro do grupo `deploy`) executa `docker compose -f docker-compose.staging.yml up -d`
  - Docker Compose lê `/opt/podigger-staging/.env` (permissões `640`, dono `deploy`, grupo `deploy`)
  - Sucesso: Todos os containers iniciam corretamente
  - Nginx resolve os nomes e estabelece conexão com sucesso
  - Usuários recebem HTTP 200 ao acessar staging-podigger.perna.app

- **Exemplo 3 - Deploy Produção (Unchanged)**:
  - Deploy para produção usa `/opt/podigger-production/.env` com mesma estrutura de permissões
  - Após a correção, produção deve continuar funcionando independentemente

- **Edge Case - Rollback em Falha**:
  - Se o deploy falhar após a correção de permissões, o rollback deve restaurar o backup do banco
  - O arquivo `.env` deve manter as permissões corretas mesmo após rollback

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- O deploy para produção deve continuar funcionando exatamente como antes, usando `/opt/podigger-production/.env` com sua própria configuração de permissões
- Os containers de infraestrutura (PostgreSQL e Redis) devem continuar iniciando corretamente
- O Nginx deve continuar na rede `podigger-proxy` e ter acesso aos containers de aplicação
- A segurança do arquivo `.env` deve ser mantida - apenas o dono e o grupo devem ter acesso, sem permissões para "outros"
- O processo de backup automático do banco de dados deve continuar funcionando
- O rollback automático em caso de falha deve continuar funcionando

**Scope:**
Todas as operações que NÃO envolvem a leitura do arquivo `.env` pelo Docker Compose em staging devem ser completamente inalteradas por esta correção. Isso inclui:
- Operações de deploy em produção
- Operações de backup e restore de banco de dados
- Configuração do Nginx e redes Docker
- Execução de migrations e collectstatic
- Health checks dos containers

## Hypothesized Root Cause

Com base na descrição do bug e na análise das permissões do arquivo, as causas mais prováveis são:

1. **Permissões Restritivas do Arquivo .env**: O arquivo `.env` tem permissões `600` (apenas o dono pode ler/escrever), mas o Docker Compose é executado pelo usuário `ubuntu`, que não é o dono (`deploy`) e não tem permissão de leitura.

2. **Usuário Incorreto Executando Docker Compose**: O workflow do GitHub Actions executa comandos via SSH como usuário `ubuntu`, mas o arquivo `.env` foi criado pelo usuário `deploy` (possivelmente em um deploy anterior ou configuração manual).

3. **Falta de Associação ao Grupo**: O usuário `ubuntu` não está no grupo `deploy`, impedindo o acesso mesmo se as permissões de grupo fossem adequadas.

4. **Criação do Arquivo com Permissões Incorretas**: O workflow cria o arquivo `.env` com `chmod 600`, que é muito restritivo para um cenário onde múltiplos usuários (ou o Docker daemon) precisam acessá-lo.

## Correctness Properties

Property 1: Bug Condition - Docker Compose Reads .env Successfully

_For any_ deploy execution where o usuário `ubuntu` executa Docker Compose em staging e o arquivo `.env` existe, o Docker Compose SHALL conseguir ler o arquivo `.env` com sucesso, obter todas as variáveis de ambiente necessárias (como `DB_PASSWORD_STAGING`), e iniciar todos os containers definidos em `docker-compose.staging.yml` (backend, frontend, db, redis, celery, celery-beat) sem erros de permissão.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Production and Security Unchanged

_For any_ deploy execution que NÃO seja para staging (como produção) ou que NÃO envolva a leitura do arquivo `.env` de staging, o sistema SHALL produzir exatamente o mesmo comportamento que o código original, preservando a segurança do arquivo `.env` (sem permissões para "outros"), o funcionamento independente do ambiente de produção, e todos os processos de backup, rollback e health checks.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

Assumindo que nossa análise de causa raiz está correta:

**File**: `.github/workflows/deploy-staging.yml`

**Step**: `Create .env on VPS (staging)`

**Specific Changes**:

1. **Ajustar Permissões do Arquivo .env**: Alterar de `chmod 600` para `chmod 640` para permitir leitura pelo grupo
   - Permissões `640` significam: dono pode ler/escrever, grupo pode ler, outros não têm acesso
   - Isso mantém a segurança adequada enquanto permite que membros do grupo `deploy` leiam o arquivo

2. **Adicionar Usuário ubuntu ao Grupo deploy**: Executar `usermod -aG deploy ubuntu` para adicionar o usuário `ubuntu` ao grupo `deploy`
   - Isso deve ser feito uma única vez na VPS, não em cada deploy
   - Pode ser adicionado como um passo de "setup inicial" no workflow ou executado manualmente na VPS

3. **Garantir Propriedade Correta do Arquivo**: Executar `chown deploy:deploy /opt/podigger-staging/.env` para garantir que o arquivo pertence ao usuário e grupo corretos
   - Isso garante que as permissões de grupo sejam aplicadas corretamente

4. **Adicionar Verificação de Permissões**: Adicionar um passo de verificação após criar o arquivo `.env` para confirmar que as permissões estão corretas
   - Isso ajuda a detectar problemas de permissões antes que o Docker Compose tente ler o arquivo

5. **Documentar Requisitos de Setup**: Atualizar a documentação para incluir o requisito de adicionar o usuário `ubuntu` ao grupo `deploy` como parte do setup inicial da VPS

### Implementação Detalhada

**Mudança no Step "Create .env on VPS (staging)"**:

```yaml
- name: Create .env on VPS (staging)
  run: |
    ssh -o ServerAliveInterval=60 -o ServerAliveCountMax=10 ${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }} bash -s << ENDSSH
      mkdir -p /opt/podigger-staging
      
      # Create .env file
      printf 'DB_PASSWORD_STAGING=%s\n' '${{ secrets.DB_PASSWORD_STAGING }}' > /opt/podigger-staging/.env
      
      # Set correct ownership and permissions
      chown deploy:deploy /opt/podigger-staging/.env
      chmod 640 /opt/podigger-staging/.env
      
      # Verify permissions
      echo "Verifying .env permissions:"
      ls -la /opt/podigger-staging/.env
      
      # Ensure ubuntu user is in deploy group (idempotent)
      if ! groups ubuntu | grep -q deploy; then
        echo "Adding ubuntu user to deploy group..."
        sudo usermod -aG deploy ubuntu
        echo "✅ User ubuntu added to deploy group. Note: SSH session may need to be refreshed for group changes to take effect."
      else
        echo "✅ User ubuntu is already in deploy group"
      fi
    ENDSSH
```

**Nota Importante**: A mudança de grupo (`usermod -aG`) requer que a sessão SSH seja reiniciada para que as mudanças de grupo tenham efeito. No entanto, como o Docker daemon roda como root e lê o arquivo em nome do usuário, isso não deve ser um problema. Se necessário, podemos adicionar um `newgrp deploy` ou executar o Docker Compose em uma nova sessão SSH.

## Testing Strategy

### Validation Approach

A estratégia de testes segue uma abordagem de duas fases: primeiro, demonstrar o bug no código não corrigido executando o deploy e observando a falha de permissões; depois, verificar que a correção funciona corretamente e preserva o comportamento existente.

### Exploratory Bug Condition Checking

**Goal**: Demonstrar o bug ANTES de implementar a correção. Confirmar ou refutar a análise de causa raiz. Se refutarmos, precisaremos re-hipotizar.

**Test Plan**: Executar o deploy para staging no código não corrigido e observar os logs do Docker Compose para confirmar o erro "permission denied" ao tentar ler o arquivo `.env`. Verificar que apenas os containers de infraestrutura (db e redis) estão rodando, enquanto os containers de aplicação (backend e frontend) não foram iniciados.

**Test Cases**:
1. **Deploy Staging com Permissões Incorretas**: Executar deploy para staging com arquivo `.env` tendo permissões `600` e dono `deploy` (falhará no código não corrigido)
   - Verificar erro: "open /opt/podigger-staging/.env: permission denied"
   - Verificar que apenas `db-staging` e `redis-staging` estão rodando
   - Verificar que `backend-staging` e `frontend-staging` não estão rodando
   - Verificar que Nginx retorna 502 Bad Gateway

2. **Verificar Permissões do Arquivo**: Executar `ls -la /opt/podigger-staging/.env` na VPS para confirmar permissões `600` e dono `deploy` (falhará no código não corrigido)

3. **Verificar Grupo do Usuário ubuntu**: Executar `groups ubuntu` na VPS para confirmar que `ubuntu` não está no grupo `deploy` (falhará no código não corrigido)

4. **Tentar Ler .env como ubuntu**: Executar `cat /opt/podigger-staging/.env` como usuário `ubuntu` para confirmar erro de permissão (falhará no código não corrigido)

**Expected Counterexamples**:
- Docker Compose não consegue ler o arquivo `.env` devido a permissões insuficientes
- Possíveis causas: permissões `600` muito restritivas, usuário `ubuntu` não no grupo `deploy`, arquivo pertence ao usuário `deploy`

### Fix Checking

**Goal**: Verificar que para todas as execuções de deploy onde a condição de bug se aplica (deploy para staging pelo usuário `ubuntu`), o Docker Compose corrigido consegue ler o arquivo `.env` e iniciar todos os containers com sucesso.

**Pseudocode:**
```
FOR ALL deployExecution WHERE isBugCondition(deployExecution) DO
  result := executeDeployWithFix(deployExecution)
  ASSERT allContainersStarted(result)
  ASSERT noPermissionErrors(result)
  ASSERT nginxResolvesContainers(result)
  ASSERT usersReceiveHTTP200(result)
END FOR
```

**Test Cases**:
1. **Deploy Staging com Permissões Corretas**: Executar deploy para staging após aplicar a correção
   - Verificar que o arquivo `.env` tem permissões `640` e dono `deploy:deploy`
   - Verificar que o usuário `ubuntu` está no grupo `deploy`
   - Verificar que todos os containers iniciam com sucesso
   - Verificar que Nginx resolve os nomes dos containers e retorna HTTP 200

2. **Verificar Leitura do .env**: Executar `cat /opt/podigger-staging/.env` como usuário `ubuntu` para confirmar que o arquivo pode ser lido

3. **Verificar Health Checks**: Executar health checks do backend e frontend para confirmar que os serviços estão respondendo corretamente

### Preservation Checking

**Goal**: Verificar que para todas as execuções que NÃO envolvem a condição de bug (como deploy para produção), o sistema corrigido produz exatamente o mesmo resultado que o sistema original.

**Pseudocode:**
```
FOR ALL deployExecution WHERE NOT isBugCondition(deployExecution) DO
  ASSERT deployWithFix(deployExecution) = deployOriginal(deployExecution)
END FOR
```

**Testing Approach**: Property-based testing é recomendado para preservation checking porque:
- Gera muitos casos de teste automaticamente através do domínio de entrada
- Captura edge cases que testes unitários manuais podem perder
- Fornece garantias fortes de que o comportamento permanece inalterado para todas as entradas não-buggy

**Test Plan**: Observar o comportamento no código não corrigido primeiro para deploys de produção e outras operações, depois escrever testes baseados em propriedades capturando esse comportamento.

**Test Cases**:
1. **Deploy Produção Preservation**: Observar que o deploy para produção funciona corretamente no código não corrigido, depois verificar que continua funcionando após a correção
   - Verificar que `/opt/podigger-production/.env` mantém suas próprias permissões
   - Verificar que todos os containers de produção iniciam corretamente
   - Verificar que o comportamento é idêntico antes e depois da correção

2. **Backup e Restore Preservation**: Observar que o processo de backup funciona corretamente no código não corrigido, depois verificar que continua funcionando após a correção
   - Verificar que backups são criados com sucesso
   - Verificar que o rollback restaura o backup corretamente

3. **Nginx e Redes Preservation**: Observar que o Nginx e as redes Docker funcionam corretamente no código não corrigido, depois verificar que continuam funcionando após a correção
   - Verificar que o Nginx está na rede `podigger-proxy`
   - Verificar que os containers de aplicação podem se comunicar com o Nginx

4. **Segurança do .env Preservation**: Verificar que o arquivo `.env` não tem permissões para "outros" (terceiro dígito de permissões deve ser 0)
   - Verificar que apenas o dono e o grupo têm acesso ao arquivo
   - Verificar que usuários fora do grupo `deploy` não conseguem ler o arquivo

### Unit Tests

- Testar criação do arquivo `.env` com permissões corretas (`640`)
- Testar adição do usuário `ubuntu` ao grupo `deploy` (idempotente)
- Testar verificação de permissões após criação do arquivo
- Testar que Docker Compose consegue ler o arquivo `.env` com as novas permissões

### Property-Based Tests

- Gerar diferentes configurações de permissões e verificar que apenas `640` ou mais permissivo permite leitura pelo grupo
- Gerar diferentes associações de grupo e verificar que apenas usuários no grupo `deploy` conseguem ler o arquivo
- Testar que mudanças de permissões não afetam o conteúdo do arquivo `.env`
- Testar que múltiplos deploys consecutivos mantêm as permissões corretas

### Integration Tests

- Testar fluxo completo de deploy para staging com a correção aplicada
- Testar que todos os containers iniciam corretamente após o deploy
- Testar que o Nginx consegue fazer proxy para os containers de aplicação
- Testar que usuários conseguem acessar staging-podigger.perna.app e staging-api-podigger.perna.app sem erro 502
- Testar que o rollback funciona corretamente em caso de falha
- Testar que o deploy para produção não é afetado pela correção
