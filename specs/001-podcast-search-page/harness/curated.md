# Curated Set

Cap: 25 entries. Importance: critical | high | medium | low.
When full, evict per `lowest-importance-oldest-first` and log the eviction in
observations.md. Findings are ≤ 2 sentences; details live behind the evidence link.

| ID | Importance | Finding | Source candidate | Evidence |
|----|------------|---------|------------------|----------|
| E001 | critical | Os 5 templates fonte do speckit em `.specify/templates/` (spec, plan, tasks, checklist, constitution) estão todos em inglês — não existe config de idioma nem versão pt-br. | C001-C006 (todos os docs) | E001 |
| E002 | high | `spec.md` é o único documento 100% em pt-br. Inclui assunção explícita "A interface será em português brasileiro". | C001 | E002 |
| E003 | high | `plan.md`, `data-model.md`, `research.md`, `quickstart.md` e `checklists/requirements.md` usam inglês nos cabeçalhos estruturais e corpo, com trechos mistos em pt. | C002, C003, C004, C005, C006 | E003 |
| E004 | medium | `contracts/search-api.md` está 100% em inglês. A blueprint rule diz "Follow the language used in existing spec/plan/tasks documents". | — | E004 |
