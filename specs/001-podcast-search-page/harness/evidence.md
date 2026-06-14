# Evidence Links

Pointers only. An entry records WHERE proof lives, not the proof itself.
Excerpts are capped at 25 words. IDs match curated.md (E001, E002…).

## E001
- Claim: Todos os 5 templates fonte do speckit estão em inglês, sem config de idioma.
- Source: .specify/templates/ (spec-template.md:1, plan-template.md:1, tasks-template.md:1, checklist-template.md:1, constitution-template.md:1)
- Locator: cabeçalho de cada template
- Excerpt: "Feature Specification: [FEATURE NAME]" / "Implementation Plan: [FEATURE]" / "Tasks: [FEATURE NAME]"
- Supports: mission #1

## E002
- Claim: spec.md é o único documento 100% em pt-br com assunção explícita de idioma.
- Source: specs/001-podcast-search-page/spec.md:1
- Locator: título + assumptions
- Excerpt: "Feature Specification: Página de Busca de Podcasts" / "A interface será em português brasileiro"
- Supports: mission #1

## E003
- Claim: plan.md, data-model.md, research.md, quickstart.md, checklist usam inglês nos cabeçalhos com conteúdo misto.
- Source: specs/001-podcast-search-page/plan.md:1, data-model.md:1, research.md:1, quickstart.md:1, checklists/requirements.md:1
- Locator: cabeçalhos e seções estruturais
- Excerpt: "Implementation Plan: Página de Busca de Podcasts" / "Data Model: Página de Busca de Podcasts" — títulos mistos, corpo EN
- Supports: mission #1

## E004
- Claim: contracts/search-api.md está 100% em inglês; blueprint rule manda seguir idioma dos docs existentes.
- Source: specs/001-podcast-search-page/contracts/search-api.md:1, .specify/extensions/blueprint/commands/speckit.blueprint.generate.md:253
- Locator: título + regra de idioma no blueprint
- Excerpt: "API Contracts: Página de Busca" / "Follow the language used in existing spec/plan/tasks documents"
- Supports: mission #1
