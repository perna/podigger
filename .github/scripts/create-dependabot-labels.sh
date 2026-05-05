#!/usr/bin/env bash
# =============================================================================
# create-dependabot-labels.sh
#
# Cria os labels necessários no repositório GitHub para que o Dependabot
# possa aplicá-los corretamente nos PRs de atualização de dependências.
#
# IMPORTANTE: Este script deve ser executado ANTES do merge do dependabot.yml
# na branch develop. O Dependabot ignora labels inexistentes silenciosamente,
# ou seja, se os labels não existirem, os PRs serão abertos sem categorização.
#
# Pré-requisitos:
#   - GitHub CLI (gh) instalado e autenticado: https://cli.github.com/
#   - Permissão de escrita no repositório
#
# Uso:
#   chmod +x .github/scripts/create-dependabot-labels.sh
#   ./.github/scripts/create-dependabot-labels.sh
#
# O script é idempotente: pode ser executado múltiplas vezes sem erros,
# pois utiliza a flag --force que atualiza o label caso ele já exista.
# =============================================================================

set -euo pipefail

echo "Criando labels do Dependabot no repositório..."
echo ""

# Label base aplicado a todos os PRs do Dependabot, independente do ecossistema
gh label create "dependencies" \
  --color "0075ca" \
  --description "Dependency update" \
  --force
echo "✓ dependencies"

# Label aplicado a PRs do ecossistema npm (frontend Next.js)
gh label create "frontend" \
  --color "7057ff" \
  --description "Frontend (npm/Next.js) related" \
  --force
echo "✓ frontend"

# Label aplicado a PRs do ecossistema pip (backend Django)
gh label create "backend" \
  --color "008672" \
  --description "Backend (pip/Django) related" \
  --force
echo "✓ backend"

# Label aplicado a PRs do ecossistema github-actions (CI/CD)
gh label create "ci-cd" \
  --color "e4e669" \
  --description "CI/CD and GitHub Actions related" \
  --force
echo "✓ ci-cd"

# Label aplicado a PRs de grupos de dependências de desenvolvimento/teste
gh label create "dev-dependencies" \
  --color "cfd3d7" \
  --description "Development/test dependency" \
  --force
echo "✓ dev-dependencies"

# Label aplicado a PRs de grupos de dependências de produção
gh label create "production-dependencies" \
  --color "d93f0b" \
  --description "Production dependency" \
  --force
echo "✓ production-dependencies"

# Label aplicado a PRs de atualizações de versão major (potencial breaking change)
gh label create "major-update" \
  --color "b60205" \
  --description "Major version update (potential breaking change)" \
  --force
echo "✓ major-update"

echo ""
echo "Todos os 7 labels foram criados com sucesso."
echo "Você já pode fazer o merge do .github/dependabot.yml na branch develop."
