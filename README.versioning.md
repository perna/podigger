# Semantic Versioning Guide

Este documento descreve como funciona o versionamento semântico automatizado do Podigger backend.

## Visão Geral

O projeto usa **[Commitizen](https://commitizen-tools.github.io/commitizen/)** para gerenciar versões automaticamente baseado em **[Conventional Commits](https://www.conventionalcommits.org/)**.

### Benefícios

- ✅ Versionamento automático baseado em commits
- ✅ CHANGELOG.md gerado automaticamente
- ✅ GitHub Releases criadas automaticamente
- ✅ Validação de mensagens de commit no CI
- ✅ Rastreamento de versão no código Python

## Conventional Commits

### Formato

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type | Descrição | Bump de Versão |
|------|-----------|----------------|
| `feat` | Nova funcionalidade | MINOR (0.X.0) |
| `fix` | Correção de bug | PATCH (0.0.X) |
| `docs` | Apenas documentação | Nenhum |
| `style` | Formatação, ponto e vírgula, etc | Nenhum |
| `refactor` | Refatoração de código | Nenhum |
| `perf` | Melhoria de performance | PATCH (0.0.X) |
| `test` | Adição/correção de testes | Nenhum |
| `chore` | Tarefas de build, configs, etc | Nenhum |
| `ci` | Mudanças em CI/CD | Nenhum |

### Breaking Changes

Para indicar uma mudança que quebra compatibilidade (MAJOR bump):

```
feat(api)!: change authentication method

BREAKING CHANGE: JWT tokens are now required for all endpoints
```

Ou adicionar `!` após o type/scope:

```
feat!: remove deprecated endpoints
```

### Scopes Sugeridos

- `backend` - Mudanças no Django backend
- `frontend` - Mudanças no React frontend
- `api` - Mudanças na API REST
- `models` - Mudanças nos models
- `parser` - Mudanças no parser de feeds
- `ci` - Mudanças em CI/CD
- `docs` - Documentação

### Exemplos

```bash
# Nova funcionalidade (bump MINOR)
feat(backend): add full-text search for podcasts

# Correção de bug (bump PATCH)
fix(parser): handle missing episode titles correctly

# Breaking change (bump MAJOR)
feat(api)!: migrate to Django REST Framework

BREAKING CHANGE: All API endpoints now use /api/v2/ prefix

# Documentação (sem bump)
docs: update README with new setup instructions

# Refatoração (sem bump)
refactor(backend): extract feed parsing logic to service layer
```

## Comandos Locais

### Ver Versão Atual

```bash
make version
```

### Bump Manual de Versão

```bash
# Patch: 0.1.0 -> 0.1.1
make bump-patch

# Minor: 0.1.0 -> 0.2.0
make bump-minor

# Major: 0.1.0 -> 1.0.0
make bump-major
```

### Gerar/Atualizar CHANGELOG

```bash
make changelog
```

### Validar Commits

```bash
cd backend
uv run cz check --rev-range HEAD~5..HEAD
```

## Workflow Automático (CI/CD)

### Pull Requests

Quando você abre um PR:

1. ✅ CI valida que todos os commits seguem Conventional Commits
2. ❌ Se algum commit não seguir o padrão, o CI falha

### Merge para Main

Quando você faz merge para `main`:

1. 🤖 GitHub Actions analisa os commits desde a última tag
2. 📦 Calcula o próximo número de versão automaticamente
3. 📝 Atualiza `CHANGELOG.md` com as mudanças
4. 🏷️ Cria uma git tag (ex: `v0.2.0`)
5. 🚀 Cria um GitHub Release com notas do changelog
6. ⬆️ Faz push da tag e commit de versão

### Workflow Manual

Você também pode acionar o release workflow manualmente:

1. Vá para **Actions** → **Release**
2. Clique em **Run workflow**
3. Escolha o tipo de bump (auto, patch, minor, major)

## Acessando a Versão no Código

```python
from config import __version__

print(f"Podigger Backend v{__version__}")
```

A versão é sincronizada automaticamente entre:
- `backend/config/__version__.py`
- `backend/pyproject.toml`

## Boas Práticas

### ✅ DO

- Use commits atômicos (uma mudança lógica por commit)
- Escreva mensagens descritivas no subject
- Use o body para explicar o "porquê" da mudança
- Referencie issues quando aplicável: `fixes #123`
- Valide seus commits antes de fazer push

### ❌ DON'T

- Não faça commits genéricos: ~~`fix: bug fix`~~
- Não misture múltiplas mudanças em um commit
- Não use mensagens vagas: ~~`chore: updates`~~
- Não esqueça o scope quando relevante

## Troubleshooting

### CI falha com "Commit messages do not follow Conventional Commits"

**Solução**: Reescreva as mensagens de commit:

```bash
# Para o último commit
git commit --amend

# Para múltiplos commits
git rebase -i HEAD~3
```

### Versão não foi bumpeada após merge

**Possíveis causas**:
1. Nenhum commit com `feat` ou `fix` desde a última tag
2. Todos os commits são `docs`, `style`, `chore`, etc

**Solução**: Isso é esperado! Apenas commits que afetam funcionalidade geram bump.

### CHANGELOG não está sendo atualizado

**Verificar**:
1. Configuração em `backend/pyproject.toml` está correta
2. Arquivo `CHANGELOG.md` existe na raiz do projeto
3. Workflow tem permissões de escrita no repositório

## Referências

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Commitizen Documentation](https://commitizen-tools.github.io/commitizen/)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
