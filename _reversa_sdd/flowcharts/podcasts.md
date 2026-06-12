# Fluxograma — Módulo `podcasts`

> Gerado pelo Arqueólogo em 2026-06-04

## Fluxo: Busca de episódios (`GET /api/episodes/?q=termo`)

```mermaid
sequenceDiagram
    participant C as Cliente
    participant V as EpisodeViewSet
    participant M as EpisodeManager
    participant DB as PostgreSQL

    C->>V: GET /api/episodes/?q=python
    V->>V: get_queryset()
    V->>M: Episode.objects.search("python")
    M->>DB: get_or_create PopularTerm(term="python")
    M->>DB: UPDATE times = times + 1
    M->>DB: SELECT com SearchVector(title[A]+description[B], config=portuguese)
    M->>DB: annotate rank=SearchRank, trigram=TrigramSimilarity
    M->>DB: filter rank__gt=0 order by -rank, -published
    alt FTS retornou resultados
        DB-->>M: episodes[]
        M-->>V: episodes[]
    else FTS vazio (fallback Trigram)
        M->>DB: filter trigram__gt=0.1 order by -trigram, -published
        DB-->>M: episodes[]
        M-->>V: episodes[]
    end
    V->>V: serializer (EpisodeSerializer)
    V-->>C: 200 {count, next, previous, results}
```

## Fluxo: Criar podcast (`POST /api/podcasts/`)

```mermaid
sequenceDiagram
    participant E as Editor/Admin
    participant V as PodcastViewSet
    participant S as PodcastService
    participant P as feed_parser
    participant DB as PostgreSQL
    participant Q as Celery

    E->>V: POST {name, feed}
    V->>S: create_podcast(name, feed)
    alt name ou feed vazio
        S-->>V: {status: "error", message: "o nome e o feed são obrigatórios"}
        V-->>E: 400 {message}
    else feed inválido
        S->>P: is_valid_feed(feed)
        P->>P: feedparser.parse(feed)
        P-->>S: bozo != 0
        S-->>V: {status: "error", message: "o feed informado é inválido"}
        V-->>E: 400 {message}
    else sucesso
        S->>DB: atomic {get_or_create(feed=feed, defaults={name})}
        alt já existe
            DB-->>S: podcast existente
            S-->>V: {status: "existing", id, message}
            V-->>E: 200 {id, message, status: "none"}
        else criado
            DB-->>S: novo podcast
            S->>Q: add_episode.delay(feed)
            S-->>V: {status: "created", id}
            V-->>E: 201 {id, status: "created"}
        end
    end
```

## Fluxo: População de episódios (Celery task `add_episode`)

```mermaid
sequenceDiagram
    participant Q as Celery Worker
    participant T as add_episode task
    participant U as EpisodeUpdater
    participant P as feed_parser
    participant DB as PostgreSQL

    Q->>T: add_episode(feed_url)
    T->>U: EpisodeUpdater([feed_url])
    T->>U: populate()
    loop para cada feed
        U->>DB: atomic {podcast = Podcast.objects.filter(feed).first()}
        alt podcast não existe
            U->>U: log warning, continue
        else podcast existe
            U->>P: parse_feed(feed_url)
            P-->>U: {title, language, image, items}
            U->>U: podcast.image = parsed.image
            U->>DB: PodcastLanguage.get_or_create(code=language)
            U->>U: podcast.language = language; save()
            loop para cada item
                U->>U: parse date (RFC 2822)
                alt data inválida
                    U->>U: log warning, skip
                else
                    U->>DB: Episode.objects.filter(link=item.link).exists?
                    alt link já existe
                        U->>U: skip (idempotência)
                    else
                        U->>DB: Episode.objects.create(to_json=item)
                        U->>DB: Tag.get_or_create + episode.tags.add()
                    end
                end
            end
            U->>U: total_episodes = count(episodes); save()
        end
    end
```

## Fluxo: Atualização periódica (Celery task `update_base`)

```mermaid
flowchart TD
    A[Celery Beat: update_base] --> B[feeds = Podcast.objects.values_list feed]
    B --> C[EpisodeUpdater.populate]
    C --> D{Para cada feed}
    D --> E[Parse + create episodes + tags]
    E --> F[Update total_episodes]
    F --> D
    D --> G[Fim do loop]
    G --> H[update_total_episodes.delay]
    H --> I[Recalcula total_episodes para todos os podcasts]
    I --> J[Fim]

    style A fill:#f9f,stroke:#333
    style H fill:#bbf,stroke:#333
```

## Fluxo: Limpeza de podcasts órfãos (Celery task `remove_podcasts`)

```mermaid
flowchart TD
    A[Celery Beat: remove_podcasts] --> B[Podcast.objects.annotate num_episodes=Count episodes]
    B --> C[filter num_episodes=0]
    C --> D[delete]
    D --> E[log: Deleted N podcasts]
    E --> F[Fim]
```

## Máquina de estados: `Episode` (relativo ao feed)

```mermaid
stateDiagram-v2
    [*] --> NewEpisode: feed parse + link único
    NewEpisode --> Persisted: Episode.objects.create
    Persisted --> Tagged: episode.tags.add(*tag_list)
    Tagged --> Counted: podcast.total_episodes++

    note right of Persisted
        to_json armazena
        o dict bruto do feed
    end note

    note right of Tagged
        Tags criadas via
        get_or_create em
        Tag.objects
    end note
```

## Diagrama de relacionamentos (ER simplificado)

```mermaid
erDiagram
    PodcastLanguage ||--o{ Podcast : "1:N"
    Podcast ||--o{ Episode : "1:N (CASCADE)"
    Episode }o--o{ Tag : "N:M"
    BaseModel <|-- PodcastLanguage : "abstract"
    BaseModel <|-- Tag : "abstract"
    BaseModel <|-- PopularTerm : "abstract"
    BaseModel <|-- TopicSuggestion : "abstract"

    Podcast {
        int id PK
        string name UK
        string feed UK
        string image
        int language FK
        int total_episodes
        datetime created_at
        datetime updated_at
    }

    Episode {
        int id PK
        string title
        string link UK
        text description
        datetime published
        string enclosure
        json to_json
        int podcast FK
    }

    Tag {
        int id PK
        string name UK
    }

    PopularTerm {
        int id PK
        string term
        int times
        date date_search
    }

    TopicSuggestion {
        int id PK
        string title
        text description
        bool is_recorded
    }
```
