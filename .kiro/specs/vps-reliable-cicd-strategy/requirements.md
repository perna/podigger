# Requirements Document: VPS Reliable CI/CD Strategy (Lite Version)

## Introduction

Este documento define os requisitos para uma estratégia de CI/CD robusta, confiável e minimalista, adaptada para deploy em VPS (não cloud) do projeto Podigger. A solução visa eliminar os problemas atuais de instabilidade, race conditions e builds durante deploy, implementando zero-downtime deployments, rollback automático, health checks robustos e gestão adequada de recursos.

Esta é a **versão "lite"** focada no essencial: estabilidade e confiabilidade sem adicionar complexidade de observabilidade avançada. Observabilidade avançada (Loki, Prometheus, Grafana, alertas proativos) pode ser adicionada posteriormente como evolução incremental.

O sistema atual apresenta falhas frequentes devido a race conditions no deploy, health checks inadequados, builds durante deploy e rollback ineficaz. A nova estratégia deve garantir deploys confiáveis, rápidos e com capacidade de recuperação automática em caso de falhas, usando ferramentas nativas do Docker e GitHub Actions.

## Glossary

- **CI_Pipeline**: Pipeline de Integração Contínua que executa testes, linting e build de imagens
- **CD_Pipeline**: Pipeline de Deploy Contínuo que realiza o deploy em staging ou production
- **VPS**: Virtual Private Server onde a aplicação é hospedada
- **GitHub_Container_Registry**: Registro gratuito de imagens Docker do GitHub (ghcr.io)
- **Health_Check**: Verificação automatizada do estado de saúde de um serviço
- **Zero_Downtime_Deploy**: Estratégia de deploy que mantém a aplicação disponível durante a atualização
- **Rollback**: Processo de reverter para a versão anterior em caso de falha
- **Rolling_Update**: Atualização gradual de containers, substituindo um por vez
- **Container_Orchestrator**: Sistema que gerencia o ciclo de vida dos containers (Docker Compose neste caso)
- **Resource_Limit**: Limite de CPU e memória definido para cada container
- **Backup_Service**: Serviço automatizado de backup do banco de dados
- **Smoke_Test**: Teste básico executado após deploy para verificar funcionalidade crítica
- **Deployment_Lock**: Mecanismo simples para prevenir deploys simultâneos (arquivo de lock)
- **Image_Tag**: Identificador único de uma imagem Docker (ex: sha-abc123, v1.2.3)
- **Graceful_Shutdown**: Encerramento controlado de um container, finalizando requisições em andamento
- **Startup_Probe**: Verificação inicial que aguarda o container estar pronto antes de receber tráfego
- **Liveness_Probe**: Verificação contínua que reinicia o container se ele travar
- **Readiness_Probe**: Verificação que remove o container do balanceamento se ele não estiver pronto
- **Pre_Deploy_Hook**: Script executado antes do deploy (ex: backup, validações)
- **Post_Deploy_Hook**: Script executado após deploy (ex: smoke tests, notificações)
- **Docker_Logs**: Sistema nativo de logs do Docker (json-file driver com rotação)
- **GitHub_Actions_Summary**: Relatório de deployment gerado no GitHub Actions

## Requirements

### Requirement 1: Image Registry and Versioning

**User Story:** Como DevOps Engineer, eu quero que todas as imagens Docker sejam buildadas no CI e versionadas no registry gratuito do GitHub, para que o deploy seja rápido e consistente sem builds na VPS e sem custos adicionais.

#### Acceptance Criteria

1. WHEN THE CI_Pipeline completes successfully, THE CI_Pipeline SHALL build Docker images for backend and frontend
2. WHEN Docker images are built, THE CI_Pipeline SHALL tag images with git commit SHA and branch name
3. WHEN images are tagged, THE CI_Pipeline SHALL push images to GitHub Container Registry (ghcr.io) using GITHUB_TOKEN
4. THE GitHub Container Registry SHALL be used at zero cost for public repositories
5. WHEN THE CD_Pipeline starts, THE CD_Pipeline SHALL pull pre-built images from GitHub Container Registry by commit SHA
6. THE CD_Pipeline SHALL authenticate to GitHub Container Registry using GITHUB_TOKEN or Personal Access Token
7. THE CD_Pipeline SHALL NOT build images on VPS during deployment
8. WHEN a deploy fails, THE Rollback SHALL use the previous image tag from GitHub Container Registry
9. THE GitHub Container Registry SHALL retain images indefinitely (no automatic deletion)
10. THE CI_Pipeline SHALL optionally clean up old images (older than 30 days) to save storage space
11. THE image naming convention SHALL be ghcr.io/OWNER/REPO/SERVICE:TAG (e.g., ghcr.io/perna/podigger/backend:sha-abc123)

### Requirement 2: Zero-Downtime Deployment Strategy

**User Story:** Como Product Owner, eu quero que deploys não causem downtime, para que usuários não sejam impactados durante atualizações.

#### Acceptance Criteria

1. WHEN THE CD_Pipeline deploys new containers, THE CD_Pipeline SHALL start new containers before stopping old ones
2. WHEN new containers are starting, THE Container_Orchestrator SHALL wait for Health_Check to pass before routing traffic
3. WHEN new containers are healthy, THE Container_Orchestrator SHALL gracefully stop old containers with 30 second timeout
4. THE Graceful_Shutdown SHALL allow in-flight requests to complete before container termination
5. WHEN old containers are stopped, THE CD_Pipeline SHALL remove old containers only after new ones are serving traffic
6. THE deployment strategy SHALL use rolling updates for stateless services (backend, frontend, celery workers)
7. THE deployment strategy SHALL use blue-green approach for database migrations (run migrations before container swap)
8. WHEN deploying to production, THE CD_Pipeline SHALL deploy to one container at a time to minimize risk

### Requirement 3: Robust Health Checks

**User Story:** Como SRE, eu quero health checks robustos e adequados, para que o sistema detecte corretamente quando serviços estão prontos e saudáveis.

#### Acceptance Criteria

1. THE Startup_Probe SHALL have initial delay of 10 seconds and timeout of 10 seconds for backend
2. THE Startup_Probe SHALL have initial delay of 5 seconds and timeout of 5 seconds for frontend
3. THE Startup_Probe SHALL retry up to 30 times with 2 second intervals before marking container as failed
4. WHEN THE Startup_Probe fails after max retries, THE Container_Orchestrator SHALL mark deployment as failed
5. THE Liveness_Probe SHALL check backend health endpoint every 30 seconds with 10 second timeout
6. THE Liveness_Probe SHALL check frontend health endpoint every 30 seconds with 5 second timeout
7. THE Readiness_Probe SHALL verify database connectivity before marking backend as ready
8. THE Readiness_Probe SHALL verify Redis connectivity before marking backend as ready
9. WHEN THE Readiness_Probe fails 3 consecutive times, THE Container_Orchestrator SHALL remove container from load balancing
10. THE Health_Check endpoints SHALL return HTTP 200 only when all dependencies are available
11. THE Health_Check endpoints SHALL return HTTP 503 when service is degraded but running
12. THE Health_Check endpoints SHALL include response time under 100ms for quick detection

### Requirement 4: Automated Rollback

**User Story:** Como DevOps Engineer, eu quero rollback automático em caso de falha, para que o sistema retorne rapidamente ao estado estável anterior.

#### Acceptance Criteria

1. WHEN THE Startup_Probe fails during deployment, THE CD_Pipeline SHALL automatically trigger rollback
2. WHEN THE Smoke_Test fails after deployment, THE CD_Pipeline SHALL automatically trigger rollback
3. WHEN rollback is triggered, THE Rollback SHALL pull the previous image tag from Docker_Registry
4. WHEN previous images are pulled, THE Rollback SHALL deploy previous version using same zero-downtime strategy
5. WHEN database migrations were applied, THE Rollback SHALL restore database from pre-deploy backup
6. THE Rollback SHALL complete within 5 minutes for application code rollback
7. THE Rollback SHALL complete within 15 minutes for database restoration
8. WHEN rollback completes, THE CD_Pipeline SHALL send alert notification with failure details
9. THE CD_Pipeline SHALL maintain deployment history with image tags for last 10 deployments
10. THE CD_Pipeline SHALL prevent new deployments while rollback is in progress using Deployment_Lock

### Requirement 5: Resource Management

**User Story:** Como SRE, eu quero limites de recursos definidos para todos os containers, para que o sistema seja estável e previsível sem OOM kills.

#### Acceptance Criteria

1. THE backend container SHALL have memory limit of 1GB and CPU limit of 1.0 cores
2. THE frontend container SHALL have memory limit of 512MB and CPU limit of 0.5 cores
3. THE celery worker container SHALL have memory limit of 1GB and CPU limit of 1.0 cores
4. THE PostgreSQL container SHALL have memory limit of 2GB and CPU limit of 2.0 cores
5. THE Redis container SHALL have memory limit of 512MB and CPU limit of 0.5 cores
6. THE nginx container SHALL have memory limit of 256MB and CPU limit of 0.25 cores
7. WHEN a container exceeds memory limit, THE Container_Orchestrator SHALL restart container and log OOM event
8. THE Resource_Limit SHALL include memory reservation of 50% of limit for guaranteed allocation
9. THE docker-compose configuration SHALL define resource limits for all services in production
10. THE docker-compose configuration SHALL define resource limits for all services in staging

### Requirement 6: Docker Native Logging

**User Story:** Como Developer, eu quero logs estruturados e acessíveis via Docker, para que eu possa troubleshoot problemas rapidamente sem ferramentas externas.

#### Acceptance Criteria

1. THE Docker_Logs SHALL use json-file driver for all containers
2. THE Docker_Logs SHALL configure log rotation with max-size of 10MB and max-file of 3
3. WHEN a container writes logs, THE Docker_Logs SHALL capture stdout and stderr in JSON format
4. THE Docker_Logs SHALL be accessible via docker compose logs command
5. THE Docker_Logs SHALL include timestamps and container names automatically
6. THE backend logs SHALL include request_id for request tracing when possible
7. THE CD_Pipeline SHALL capture and display logs in GitHub Actions output during deployment
8. WHEN deployment fails, THE CD_Pipeline SHALL include last 50 lines of relevant container logs in failure report
9. THE logs SHALL be retained on VPS disk until manual cleanup or disk space management
10. THE docker-compose configuration SHALL define logging configuration for all services

### Requirement 7: Basic Container Metrics

**User Story:** Como SRE, eu quero métricas básicas de containers via Docker stats, para que eu possa identificar problemas de recursos sem ferramentas externas.

#### Acceptance Criteria

1. THE CD_Pipeline SHALL collect docker stats output during deployment for health verification
2. THE docker stats output SHALL include CPU usage, memory usage, and network I/O for each container
3. THE CD_Pipeline SHALL log container resource usage in GitHub Actions summary after deployment
4. WHEN a container exceeds 90% memory usage, THE CD_Pipeline SHALL log warning in deployment report
5. WHEN a container is restarting frequently, THE CD_Pipeline SHALL detect and log in deployment report
6. THE health check endpoints SHALL include basic metrics (response time, dependency status)
7. THE CD_Pipeline SHALL verify no containers are in "restarting" state before marking deployment as successful
8. THE deployment report SHALL include before/after resource usage comparison
9. THE VPS SHALL have disk space monitoring via df command in deployment scripts
10. WHEN disk usage exceeds 85%, THE CD_Pipeline SHALL log warning in deployment report

### Requirement 8: Deployment Notifications

**User Story:** Como DevOps Engineer, eu quero notificações de deployment via Discord/Slack, para que o time seja informado sobre deploys e falhas.

#### Acceptance Criteria

1. THE CD_Pipeline SHALL send deployment start notification to Discord webhook for production
2. THE CD_Pipeline SHALL send deployment success notification with summary to Discord webhook
3. THE CD_Pipeline SHALL send deployment failure notification with error details to Discord webhook
4. THE Discord notification SHALL include commit SHA, deployer, branch, and environment
5. THE Discord notification SHALL include direct link to GitHub Actions run
6. WHEN rollback occurs, THE CD_Pipeline SHALL send rollback notification to Discord webhook
7. THE Discord webhook URL SHALL be stored in GitHub Secrets
8. THE notification SHALL use color coding (green for success, red for failure, yellow for rollback)
9. THE notification SHALL include deployment duration
10. THE staging deployments MAY use simpler notifications or skip notifications

### Requirement 9: Local Database Backup

**User Story:** Como DBA, eu quero backups automáticos locais e confiáveis, para que eu possa recuperar dados em caso de falha.

#### Acceptance Criteria

1. THE Backup_Service SHALL create database backup before every production deployment
2. THE Backup_Service SHALL create scheduled backups daily at 2 AM UTC via cron in db-backup container
3. WHEN backup is created, THE Backup_Service SHALL compress backup using gzip
4. THE Backup_Service SHALL store backups in /opt/podigger-{env}/backups directory on VPS
5. THE Backup_Service SHALL retain 7 daily backups for production
6. THE Backup_Service SHALL retain 3 daily backups for staging
7. THE Backup_Service SHALL verify backup file size is greater than 0 bytes after creation
8. WHEN backup creation fails, THE CD_Pipeline SHALL abort deployment
9. THE Backup_Service SHALL log backup size and timestamp for monitoring
10. THE backup files SHALL be named with format backup-YYYYMMDD-HHMMSS.sql.gz
11. THE CD_Pipeline SHALL verify latest backup exists and is recent (less than 7 days old) before deployment

### Requirement 10: Deployment Smoke Tests

**User Story:** Como QA Engineer, eu quero smoke tests executados automaticamente após deploy, para que problemas críticos sejam detectados imediatamente.

#### Acceptance Criteria

1. WHEN deployment completes, THE Post_Deploy_Hook SHALL execute smoke tests
2. THE Smoke_Test SHALL verify backend health endpoint returns HTTP 200
3. THE Smoke_Test SHALL verify frontend homepage returns HTTP 200
4. THE Smoke_Test SHALL verify database connectivity by executing simple query
5. THE Smoke_Test SHALL verify Redis connectivity by executing PING command
6. THE Smoke_Test SHALL verify Celery worker is processing tasks by submitting test task
7. THE Smoke_Test SHALL verify static files are served correctly by checking CSS file
8. THE Smoke_Test SHALL verify API authentication endpoint is functional
9. WHEN any smoke test fails, THE CD_Pipeline SHALL trigger automatic rollback
10. THE Smoke_Test SHALL complete within 2 minutes
11. THE Smoke_Test results SHALL be logged and included in deployment summary

### Requirement 11: Simple Deployment Locking

**User Story:** Como DevOps Engineer, eu quero prevenir deploys simultâneos de forma simples, para que race conditions e conflitos sejam evitados.

#### Acceptance Criteria

1. WHEN THE CD_Pipeline starts, THE CD_Pipeline SHALL create lock file at /tmp/deploy-{environment}.lock on VPS via SSH
2. WHEN lock file already exists, THE CD_Pipeline SHALL check if lock is stale (older than 45 minutes)
3. WHEN lock is stale, THE CD_Pipeline SHALL remove stale lock and create new lock
4. WHEN lock is fresh (less than 45 minutes old), THE CD_Pipeline SHALL fail with clear error message
5. THE lock file SHALL contain workflow run ID, deployer username, and timestamp
6. WHEN deployment completes successfully, THE CD_Pipeline SHALL remove lock file
7. WHEN deployment fails, THE CD_Pipeline SHALL remove lock file after rollback completes
8. THE lock file SHALL be environment-specific (separate locks for staging and production)
9. WHEN lock acquisition fails, THE error message SHALL include lock holder information
10. THE CD_Pipeline SHALL log lock acquisition and release events in GitHub Actions output

### Requirement 12: Container Lifecycle Management

**User Story:** Como DevOps Engineer, eu quero gerenciamento adequado do ciclo de vida dos containers, para que race conditions e conflitos de nomes sejam eliminados.

#### Acceptance Criteria

1. WHEN THE CD_Pipeline deploys new version, THE CD_Pipeline SHALL use unique container names with version suffix
2. WHEN new containers are started, THE Container_Orchestrator SHALL verify no name conflicts exist
3. WHEN old containers are stopped, THE Graceful_Shutdown SHALL send SIGTERM and wait 30 seconds
4. WHEN graceful shutdown timeout is reached, THE Container_Orchestrator SHALL send SIGKILL
5. WHEN containers are removed, THE CD_Pipeline SHALL remove containers by ID not by name to avoid conflicts
6. THE CD_Pipeline SHALL clean up dangling images after successful deployment
7. THE CD_Pipeline SHALL clean up stopped containers older than 24 hours
8. THE CD_Pipeline SHALL NOT use docker-compose down during deployment to avoid removing running containers
9. THE CD_Pipeline SHALL use docker-compose up --no-deps --force-recreate for individual service updates
10. WHEN container fails to start, THE Container_Orchestrator SHALL log failure reason and exit code

### Requirement 13: Migration Safety

**User Story:** Como Developer, eu quero migrations executadas de forma segura, para que o banco de dados permaneça consistente durante deploys.

#### Acceptance Criteria

1. WHEN THE CD_Pipeline deploys new version, THE Pre_Deploy_Hook SHALL execute database migrations
2. WHEN migrations are executed, THE Pre_Deploy_Hook SHALL run migrations in a one-off container
3. WHEN migrations start, THE Pre_Deploy_Hook SHALL verify database backup was created successfully
4. WHEN migrations fail, THE CD_Pipeline SHALL abort deployment and trigger rollback
5. THE migrations SHALL use transaction-based approach when possible for atomicity
6. THE migrations SHALL include timeout of 10 minutes to prevent hanging
7. WHEN migrations complete, THE Pre_Deploy_Hook SHALL verify migration status using showmigrations
8. THE CD_Pipeline SHALL log migration output for troubleshooting
9. WHEN backward-incompatible migrations are detected, THE CD_Pipeline SHALL require manual approval
10. THE migrations SHALL be tested in staging environment before production deployment

### Requirement 14: Environment Configuration Management

**User Story:** Como DevOps Engineer, eu quero configuração de ambiente gerenciada de forma segura e versionada, para que mudanças sejam rastreáveis e auditáveis.

#### Acceptance Criteria

1. THE CD_Pipeline SHALL store sensitive configuration in GitHub Secrets
2. THE CD_Pipeline SHALL generate .env files dynamically during deployment from secrets
3. THE CD_Pipeline SHALL validate required environment variables before deployment
4. WHEN environment variables are missing, THE CD_Pipeline SHALL fail with clear error message listing missing variables
5. THE CD_Pipeline SHALL use different secrets for staging and production environments
6. THE docker-compose files SHALL reference environment variables without hardcoded values
7. THE CD_Pipeline SHALL log non-sensitive configuration values for audit trail
8. THE CD_Pipeline SHALL NOT log sensitive values (passwords, keys, tokens)
9. WHEN configuration changes, THE CD_Pipeline SHALL require container restart to apply changes
10. THE environment configuration SHALL be documented in .env.example files with descriptions

### Requirement 15: Deployment Observability

**User Story:** Como DevOps Engineer, eu quero visibilidade completa do processo de deployment, para que eu possa entender o que está acontecendo e troubleshoot problemas.

#### Acceptance Criteria

1. THE CD_Pipeline SHALL log each deployment step with timestamp and status
2. THE CD_Pipeline SHALL create GitHub deployment status for each environment
3. WHEN deployment starts, THE CD_Pipeline SHALL post deployment notification to Discord
4. WHEN deployment completes, THE CD_Pipeline SHALL post success notification with deployment summary
5. WHEN deployment fails, THE CD_Pipeline SHALL post failure notification with error details and logs
6. THE deployment summary SHALL include commit SHA, deployer, duration, and services updated
7. THE CD_Pipeline SHALL generate deployment report in GitHub Actions summary
8. THE deployment report SHALL include health check results, smoke test results, and resource usage
9. THE CD_Pipeline SHALL track deployment metrics (frequency, duration, success rate, rollback rate)
10. THE Grafana dashboard SHALL display deployment timeline with success/failure indicators
11. THE CD_Pipeline SHALL provide deployment comparison showing diff between current and previous version

### Requirement 16: Performance Optimization

**User Story:** Como DevOps Engineer, eu quero deploys rápidos e eficientes, para que o time possa iterar rapidamente.

#### Acceptance Criteria

1. THE CI_Pipeline SHALL use Docker layer caching to speed up image builds
2. THE CI_Pipeline SHALL use multi-stage builds to minimize final image size
3. THE CD_Pipeline SHALL pull only changed images to minimize network transfer
4. THE CD_Pipeline SHALL use rsync with compression for file transfers to VPS
5. THE CD_Pipeline SHALL parallelize independent deployment steps when possible
6. THE deployment process SHALL complete within 5 minutes for application-only changes
7. THE deployment process SHALL complete within 10 minutes for changes including migrations
8. THE CD_Pipeline SHALL use SSH connection multiplexing to reduce connection overhead
9. THE CD_Pipeline SHALL cache dependencies in CI to avoid repeated downloads
10. THE docker-compose configuration SHALL use volume mounts for static files to avoid copying

### Requirement 17: Basic Disaster Recovery

**User Story:** Como SRE, eu quero procedimentos documentados de disaster recovery, para que o sistema possa ser restaurado rapidamente em caso de falha catastrófica.

#### Acceptance Criteria

1. THE disaster recovery documentation SHALL include step-by-step restoration procedures
2. THE disaster recovery documentation SHALL include RTO (Recovery Time Objective) of 2 hours
3. THE disaster recovery documentation SHALL include RPO (Recovery Point Objective) of 24 hours
4. THE disaster recovery procedures SHALL include manual database restoration from local backup
5. THE disaster recovery procedures SHALL include container recreation from GitHub Container Registry
6. THE disaster recovery procedures SHALL include volume restoration for media files
7. THE disaster recovery documentation SHALL include contact information for escalation
8. THE disaster recovery documentation SHALL include rollback procedures for failed migrations
9. THE disaster recovery documentation SHALL be stored in repository docs/ directory
10. THE disaster recovery procedures SHALL be reviewed quarterly by team

### Requirement 18: Basic Security Hardening

**User Story:** Como Security Engineer, eu quero o pipeline de deploy endurecido contra ataques básicos, para que credenciais e sistemas sejam protegidos.

#### Acceptance Criteria

1. THE CD_Pipeline SHALL use SSH key authentication instead of passwords
2. THE CD_Pipeline SHALL use least-privilege service accounts for deployments
3. THE GitHub_Container_Registry SHALL require authentication for image pulls
4. THE GitHub_Container_Registry SHALL use GITHUB_TOKEN or Personal Access Token
5. THE CD_Pipeline SHALL use encrypted connections for all external communications
6. THE VPS SHALL have basic firewall rules (UFW) allowing only SSH, HTTP, and HTTPS
7. THE secrets SHALL be stored in GitHub Secrets and never committed to repository
8. THE .env files SHALL be generated dynamically during deployment from GitHub Secrets
9. THE CD_Pipeline SHALL NOT log sensitive values (passwords, keys, tokens) in output
10. THE SSH keys SHALL be rotated annually or when compromised

### Requirement 19: Multi-Environment Consistency

**User Story:** Como DevOps Engineer, eu quero configuração consistente entre staging e production, para que comportamento seja previsível.

#### Acceptance Criteria

1. THE staging environment SHALL use same Docker images as production
2. THE staging environment SHALL use same docker-compose structure as production
3. THE staging environment SHALL use same resource limits as production
4. THE staging environment SHALL use same health check configuration as production
5. THE staging environment SHALL use same deployment strategy as production
6. THE differences between staging and production SHALL be limited to environment variables
7. THE differences between staging and production SHALL be documented in configuration files
8. THE CD_Pipeline SHALL use same deployment scripts for both environments with environment parameter
9. THE CD_Pipeline SHALL validate configuration consistency between environments before deployment
10. WHEN configuration drift is detected, THE CD_Pipeline SHALL report differences in deployment summary

### Requirement 20: Manual Rollback Capability

**User Story:** Como DevOps Engineer, eu quero capacidade de rollback manual, para que eu possa reverter deploys em emergências.

#### Acceptance Criteria

1. THE CD_Pipeline SHALL include manual rollback workflow trigger in GitHub Actions
2. THE manual rollback workflow SHALL accept target commit SHA or "previous" as input
3. WHEN "previous" is selected, THE rollback SHALL use the last successful deployment image tag
4. THE rollback workflow SHALL pull specified image tag from GitHub Container Registry
5. THE rollback workflow SHALL deploy using same zero-downtime strategy as normal deployment
6. THE rollback workflow SHALL optionally restore database from specified backup file
7. THE rollback workflow SHALL verify services are healthy after rollback
8. THE rollback workflow SHALL send notification to Discord with rollback details
9. THE rollback workflow SHALL log rollback event in deployment history
10. THE rollback documentation SHALL include step-by-step manual rollback instructions

