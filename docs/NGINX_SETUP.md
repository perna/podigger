# Configuração do Nginx Global — Podigger

> **Versão**: 2.0
> **Última atualização**: 2026-03-19
> **Substitui**: `TRAEFIK_SETUP.md` (Removido) e `NGINX_PROXY_MANAGER_SETUP.md`

Este documento explica como a infraestrutura do Podigger usa um **Único Proxy Global (Nginx)** junto ao **Cloudflare Origin Certificates** para servir múltiplos ambientes (`staging` e `production`) no mesmo servidor sem conflitos de portas (80/443).

---

## 🏗️ Visão Geral da Arquitetura

O tráfego chega ao usuário final criptografado pela Cloudflare. A Cloudflare se conecta ao nosso servidor usando a porta 443 através de certificados internos da própria Cloudflare (Modo "Full Strict").

1. **Cloudflare**: Lida com DNS (Nuvem Laranja / Proxied) e emite os certificados para os usuários finais.
2. **Nginx Global**: Um único container rodando no servidor nas portas 80/443 na rede externa `podigger-proxy`. Ele carrega os "Cloudflare Origin Certificates" e distribui as rotas usando o nome dos containers.
3. **Ambientes (Staging/Production)**: Rodam sem proxy integrado. A rede `podigger-proxy` é anexada ao Backend e Frontend, permitindo que o Nginx converse diretamente com eles pelas portas internas internas (3000 e 8000).

---

## 🔒 1. Emitindo o Certificado Origin da Cloudflare

Na Cloudflare, para que a conexão seja 100% segura (Modo Full/Strict) sem avisos de certificado autoassinado, precisamos usar o *Origin Certificate*.

1. Acesse o dashboard da Cloudflare > Domínio `perna.app`.
2. Vá em **SSL/TLS** > **Origin Server**.
3. Clique em **Create Certificate**.
4. Mantenha as configurações padrões (gerar chave RSA via Cloudflare, lista de hosts validos para o domínio `*.perna.app` e `perna.app`).
5. A validade pode ser de 15 anos.
6. A Cloudflare mostrará **dois blocos de texto**: o *Origin Certificate* e a *Private Key*.

---

## 📂 2. Instalando o Certificado na VPS

Você precisa copiar os certificados pro servidor, dentro da pasta do Proxy Global:

```bash
# Na VPS, crie os diretórios
mkdir -p /opt/podigger-nginx-proxy/certs

# Copie o conteúdo para os arquivos
nano /opt/podigger-nginx-proxy/certs/cloudflare.crt
# (cole o Origin Certificate)

nano /opt/podigger-nginx-proxy/certs/cloudflare.key
# (cole a Private Key)
```

⚠️ **Atenção**: Estes arquivos são necessários para o Nginx iniciar (veja os mapping de volume em `docker-compose.yml`).

---

## 🚀 3. Colocando o Proxy Global no Ar

Uma vez que os certificados estão na pasta `/opt/podigger-nginx-proxy/certs`, você pode iniciar o gateway.

Via GitHub Actions o repositório copiará automaticamente a pasta `nginx-proxy` (do código fonte) para a VPS em `/opt/podigger-nginx-proxy`, exceto os `.crt/.key` que devem ser criados lá manualmente como mostrado acima.

```bash
cd /opt/podigger-nginx-proxy

# Cria a rede global de comunicação (só roda 1x)
docker network create podigger-proxy 

# Inicia o Nginx global
docker compose up -d
```

---

## 🔄 4. Deploys de Staging e Produção

Após o Nginx estar no ar, você pode fazer o deploy dos projetos (`staging` ou `production`) normalmente via GitHub Actions.

Eles já estão configurados para:
- Conectar automaticamente na rede `podigger-proxy`
- Expor apenas conexões na rede interna, sem disputar porta 80 ou 443 do host VPS.

A Cloudflare repassa a requisição pro IP da VPS. O Nginx escuta, lê a configuração (`podigger.conf` ou `podigger-staging.conf`), descriptografa o TLS usando a chave privada da Cloudflare e envia o request em HTTP plano para o container do Docker (ex: `http://podigger-staging-frontend:3000`).

---

## 🛠️ Troubleshooting

- **521 Web Server Is Down (Cloudflare)**:
  - O Nginx não está rodando. Verifique `docker ps` e garanta que `podigger-nginx-proxy` está Up.
  - Teste os logs: `docker logs podigger-nginx-proxy`.

- **526 Invalid SSL certificate (Cloudflare)**:
  - Significa que o SSL Mode está em "Full (Strict)", mas o Nginx não está usando o .crt/.key oficial da Cloudflare gerado pro domínio. Confirme se as chaves em `/opt/podigger-nginx-proxy/certs/` estão corretas.

- **502 Bad Gateway (Nginx)**:
  - O Nginx escutou o pedido, mas o container do React/Django está caído ou na rede errada.
  - Rode `docker network inspect podigger-proxy` e veja se os containers (`podigger-production-frontend`, etc) estão na lista de participantes.
