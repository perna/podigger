# Podigger

Motor de busca para conteúdo de podcasts. Permite descobrir episódios por assunto, agregando feeds RSS e oferecendo busca full-text.

## Language

**Episódio** (Episode):
Uma edição individual de um podcast, com título, descrição, link e data de publicação.
_Avoid_: Entry, item

**Podcast**:
Uma fonte RSS que agrega episódios. Tem nome, feed URL, imagem e idioma.
_Avoid_: Show, program

**Feed**:
O endereço RSS/Atom de onde os episódios são importados.
_Avoid_: RSS URL, source

**Termo de busca** (Search Term):
A string que o usuário digita para encontrar episódios ou podcasts.
_Avoid_: Query, palavra-chave

**Termo popular** (Popular Term):
Um termo de busca frequentemente usado, rastreado pelo sistema para analytics.
_Avoid_: Trending term, hot topic

**Tag**:
Uma etiqueta associada a um episódio, extraída do feed RSS.
_Avoid_: Categoria, label
