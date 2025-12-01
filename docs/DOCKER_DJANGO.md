Objetivo

Arquivos auxiliares para iniciar um backend Django (Django 5.2.8) em containers sem alterar o Dockerfile/compose existentes do projeto Flask.

Estrutura proposta

- `backend/` — código e Dockerfile do backend Django. Contém `requirements.txt` com dependências (Django 5.2.8, uvicorn, ruff).
- `frontend/` — aplicação cliente separada (Vite + React + TypeScript).
- `docker-compose.django.yml` — Compose que sobe `web` (Django), `db` (Postgres), `redis` e `celery`, construindo a imagem a partir de `backend/`.

Como usar (desenvolvimento local)

docker compose -f docker-compose.django.yml up --build
1) Construa a imagem e suba containers:

```bash
# a partir do diretório do repo
docker compose -f docker-compose.django.yml up --build
```

2) O serviço Django ficará exposto em `http://localhost:8000`.

Notas e próximos passos

- Estes arquivos são um scaffold inicial. Ainda é necessário gerar o projeto Django (manage.py, settings, apps) — posso gerar um esqueleto compatível com os modelos existentes.
- O `backend/` contém agora o Dockerfile e `requirements.txt` canônicos para o novo backend. Arquivos antigos no root foram marcados como legados.
- Assunção: você quer migrar gradualmente. Se preferir sobrescrever os arquivos existentes (Dockerfile e docker-compose.yml), posso alterar diretamente.
