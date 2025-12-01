# Frontend Setup

Este diretório contém a aplicação Next.js do projeto.

## Configuração do Ambiente

### Setup Automático

Execute o script de setup para configurar todo o ambiente frontend:

```bash
# A partir da raiz do projeto
./scripts/setup-frontend.sh
```

Este script irá:
- ✅ Instalar NVM (Node Version Manager)
- ✅ Instalar Node.js 24 LTS
- ✅ Instalar pnpm como package manager
- ✅ Configurar troca automática de versão do Node ao entrar no diretório frontend
- ✅ Instalar todas as dependências do projeto

### Setup Manual

Se preferir configurar manualmente:

1. **Instalar NVM:**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```

2. **Instalar Node.js 24 LTS:**
```bash
nvm install 24 --lts
nvm use 24
nvm alias default 24
```

3. **Instalar pnpm:**
```bash
npm install -g pnpm
```

4. **Instalar dependências:**
```bash
cd frontend
pnpm install
```

## Troca Automática de Versão do Node

O arquivo `.nvmrc` especifica a versão do Node.js (24 LTS). Quando você entra no diretório `frontend/`, a versão do Node é automaticamente trocada se você configurou o hook no seu shell.

Para ativar manualmente:
```bash
nvm use
```

## Comandos Disponíveis

### Desenvolvimento
```bash
pnpm dev          # Inicia servidor de desenvolvimento (http://localhost:3000)
pnpm build        # Build de produção
pnpm start        # Inicia servidor de produção
```

### Qualidade de Código
```bash
pnpm lint         # Executa ESLint
pnpm tsc --noEmit # Verifica tipos TypeScript
```

### Testes
```bash
pnpm test              # Executa testes unitários (Jest)
pnpm test:watch        # Executa testes em modo watch
pnpm test:coverage     # Executa testes com cobertura
pnpm test:e2e          # Executa testes E2E (Playwright)
```

## Stack Tecnológica

- **Framework:** Next.js 16 (App Router)
- **Runtime:** Node.js 24 LTS
- **Package Manager:** pnpm 9
- **Linguagem:** TypeScript 5
- **UI:** React 19 + Tailwind CSS 4
- **Linting:** ESLint 9
- **Testes:** Jest + Playwright (E2E)

## Estrutura de Diretórios

```
frontend/
├── app/                    # App Router (Next.js 13+)
│   ├── layout.tsx         # Layout raiz
│   ├── page.tsx           # Página inicial
│   └── globals.css        # Estilos globais
├── public/                # Assets estáticos
├── .next/                 # Build output (gitignored)
├── node_modules/          # Dependências (gitignored)
├── .nvmrc                 # Versão do Node.js
├── package.json           # Dependências e scripts
├── pnpm-lock.yaml         # Lock file do pnpm
├── tsconfig.json          # Configuração TypeScript
├── next.config.ts         # Configuração Next.js
├── eslint.config.mjs      # Configuração ESLint
└── postcss.config.mjs     # Configuração PostCSS
```

## CI/CD

O pipeline de CI está configurado no GitHub Actions (`.github/workflows/frontend.yml`) e executa:

1. **Lint:** Verificação de código com ESLint
2. **Type Check:** Verificação de tipos TypeScript
3. **Test:** Testes unitários com Jest
4. **Build:** Build de produção
5. **E2E:** Testes end-to-end com Playwright
6. **Quality Gate:** Validação de todos os jobs

O pipeline é acionado em:
- Push para `main` ou `develop`
- Pull requests para `main` ou `develop`
- Apenas quando há mudanças em `frontend/**` ou no workflow

## Variáveis de Ambiente

Crie um arquivo `.env.local` para variáveis de ambiente locais:

```bash
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Outras configurações...
```

## Troubleshooting

### Versão errada do Node

Se o Node não trocar automaticamente:
```bash
cd frontend
nvm use
```

### Problemas com dependências

Limpe o cache e reinstale:
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Build falhando

Verifique se está usando a versão correta do Node:
```bash
node --version  # Deve ser v24.x.x
```

## Recursos

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [pnpm Documentation](https://pnpm.io)
