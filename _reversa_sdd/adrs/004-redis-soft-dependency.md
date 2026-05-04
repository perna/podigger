# ADR-004: Redis como Soft Dependency no Health Check

> Status: Aceito
> Data: 2026-04-09
> Contexto: Introduzido no commit `a3827a2` ("fix(ci): treat Redis as soft dependency in health check")

## Contexto e problema

O `health_check` original retornava HTTP 503 se **qualquer** dependência (PostgreSQL ou Redis) estivesse indisponível. Isso causava falha em deploys rolling: o container podia estar pronto para receber tráfego, mas o Redis (dependência do Celery broker e cache) ainda estava inicializando, fazendo o health check falhar e o orchestrator (Docker Compose / Kubernetes) marcar o container como unhealthy.

## Decisão

Tratar Redis como **soft dependency** e PostgreSQL como **hard dependency** no endpoint `/health/`:

- 🟢 **PostgreSQL indisponível** → HTTP 503 (servidor não pode operar).
- 🟡 **Redis indisponível** → HTTP 200 com `status: "degraded"` (servidor pode servir leitura; Celery tasks ficam enfileiradas).

### Implementação

```python
# backend/podcasts/health.py
def health_check(_request):
    health_status = {"status": "healthy", "checks": {}}
    status_code = 200

    # Database is a hard dependency — fail with 503 if unreachable
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
    except Exception as e:
        health_status["status"] = "unhealthy"
        status_code = 503

    # Redis/Cache is a soft dependency — report degraded but keep HTTP 200
    try:
        cache.set("health_check", "ok", 10)
        if cache.get("health_check") != "ok":
            health_status["status"] = "degraded"
    except Exception:
        health_status["status"] = "degraded"

    return JsonResponse(health_status, status=status_code)
```

🟢 Fonte: `backend/podcasts/health.py` (commit `a3827a2`).

### Mudanças complementares no CI

- 🟢 Workflow de CI substituído `curl -f` por comparação explícita de status (`200` ou `503` = "serviço up").
- 🟢 Polling interno aumentado de 12 para 20 retries (100 s total).

## Consequências

### Positivas
- 🟢 **Deploys rolling não travam** por ordem de inicialização dos containers.
- 🟢 **Operação sem Celery** (ex: ambiente de preview) é possível.
- 🟢 **Latência de health check** baixa (não bloqueia em timeout de Redis).

### Negativas
- 🟡 **Alarmes externos** precisam inspecionar `status: "degraded"` para distinguir 200-OK-real de 200-degradado.
- 🟡 **Celery tasks** não serão processadas enquanto Redis estiver down — o operador precisa monitorar isso separadamente.

## Alternativas consideradas

1. **503 se qualquer dependência estiver down**: rejeitada. Causava falha em deploys rolling.
2. **Não incluir Redis no health check**: rejeitada. Perderia visibilidade de degradação.
3. **Endpoint separado `/health/live` e `/health/ready`**: não implementada, mas considerada. `live` seria 200 sempre, `ready` checaria tudo. Decidiu-se unificar para simplicidade.
