# Change Log

## [0.1.2] - 2014-07-10

### Added
- Adição do Gulp no stack para a otimização do css e js do projeto;
- Favicon;
- Implementação da funcionalidade "Trends" que traz os termos mais buscados nos ultimos 7, 15 e 30 dias;
- Implementação da funcionalidade de criação e listagem de sugestões de pautas;
- Adição do Flask-Cache para realizar o cache das páginas estáticas;

### Changed
- Substituição do aviso de sincronização da task de atualização de podcasts através de emails com SendGrid pelo [healthchecks.io](https://healthchecks.io/);
- Mudança da paginação na página de busca;
- Substituição do Vagrant como ambiente de desenvolvimento para o Docker;
- Correção do texto da página "Sobre o Podiggger";
- Alteração no tratamento das buscas por episódios.

### Fixed
- Correção do parser que gerava erro  na sincronização de episódios sem título.

### Removed
- AngularJS.

## 0.0.1 - 2016-06-19
- Primeira versão em lançada.
