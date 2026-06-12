# Fluxogramas — frontend-features

> Diagramas Mermaid para o módulo `frontend-features`.
> Gerado pelo Arqueólogo em 2026-06-05.

---

## 1. Composição da Home (`HomeClient`)

```mermaid
graph TB
    A[HomeClient] --> B[SearchHero]
    A --> C[PodcastsSection<br/>condicional: searchTerm]
    A --> D[EpisodesSection]
    A --> E[Sidebar<br/>hidden lg:block]
    A --> F[BottomNav<br/>md:hidden]
    A --> G[FAB]

    B --> B1[query local]
    B --> B2[Enter ou click → onSearch]

    C --> C1[se searchTerm setado]
    C1 --> C2[fetchPodcasts]
    C2 --> C3{results > 0?}
    C3 -->|Sim| C4[grid 1-2 col PodcastCard]
    C3 -->|Não| C5[mensagem 'No podcasts found']

    D --> D1[EpisodeList]
    D1 --> D2[searchTerm prop]
    D1 --> D3[onLoadingChange → setIsSearching]

    E --> E1[Trending Podcasts<br/>placeholder]
    E --> E2[Podigger Pro CTA]

    F --> F1[4 items<br/>Home/Search/Library/Settings]

    G --> G1[RSS Feed icon<br/>sem onClick - TBD]
```

---

## 2. Fluxo de infinite scroll em `EpisodeList`

```mermaid
sequenceDiagram
    participant U as User
    participant EL as EpisodeList
    participant IO as IntersectionObserver
    participant API as fetchEpisodes (lib/api)

    Note over EL: Mount com searchTerm=""
    U->>EL: searchTerm muda (props)
    EL->>EL: useEffect [searchTerm]
    EL->>EL: setPage(1)
    EL->>EL: load(term, 1, append=false)
    EL->>API: fetchEpisodes(term, 1)
    API-->>EL: {results, next, previous}
    EL->>EL: setEpisodes(results)
    EL->>EL: setHasMore(!!next)

    Note over EL,IO: useEffect [hasMore, isLoading, ...]
    EL->>IO: observe(loadMoreRef div)
    IO-->>EL: entry.isIntersecting=true
    EL->>EL: setPage(p => p+1)
    EL->>EL: load(term, p+1, append=true)
    EL->>API: fetchEpisodes(term, p+1)
    API-->>EL: {results, next}
    EL->>EL: setEpisodes(prev+results)

    alt error
        API-->>EL: throws
        EL->>EL: setError(err)
        EL->>U: render <EmptyState type="error" onRetry/>
    else episodes.length === 0
        EL->>U: render <EmptyState type="no-results"|"no-episodes"/>
    else ok
        EL->>U: render EpisodeCardCompact (md+)<br/>ou EpisodeCard (mobile)
    end
```

---

## 3. Fluxo de auth (Defesa em camadas: middleware + page guard + UI)

```mermaid
sequenceDiagram
    participant U as User
    participant MW as middleware.ts (Edge)
    participant PG as Page (ex: AddPodcastPage)
    participant Auth as AuthContext
    participant API as /api/auth/* routes
    participant Nav as Navbar

    U->>MW: GET /add-podcast
    MW->>MW: cookies.get('access_token')
    alt access_token ausente
        MW-->>U: 302 → /auth/unauthorized?next=/add-podcast
        U->>PG: GET /auth/unauthorized
        PG-->>U: render tela "Acesso restrito" + botão Login
    else access_token presente
        MW->>PG: NextResponse.next()
        PG->>Auth: useAuth() → user
        alt user null OU role não é editor/admin
            PG-->>U: render "Acesso Negado" inline
        else user.role in [editor, admin]
            PG-->>U: render form
        end
    end

    Note over U,Nav: Logout flow
    U->>Nav: click "Logout"
    Nav->>API: POST /api/auth/logout
    API-->>Nav: 200 + 2 Set-Cookie Max-Age=0
    Nav->>Auth: logout() → setUser(null)
    Nav->>U: router.push('/')
```

---

## 4. Theme switching (`ThemeProvider` + `useTheme`)

```mermaid
stateDiagram-v2
    [*] --> Init: ThemeProvider mount
    Init --> ReadLocalStorage: useState lazy init
    ReadLocalStorage --> Light: stored === 'light'
    ReadLocalStorage --> Dark: stored === 'dark'
    ReadLocalStorage --> DetectSystem: stored === null
    DetectSystem --> Light: matchMedia('(prefers-color-scheme: light)')
    DetectSystem --> Dark: else (default)

    Light --> ApplyClass: useEffect
    Dark --> ApplyClass: useEffect
    ApplyClass --> PersistLS: localStorage.setItem('podigger-theme', theme)
    ApplyClass --> ToggleHTMLClass: root.classList.add(theme)<br/>root.classList.remove(other)

    state ApplyClass {
        [*] --> ClassToggled
        ClassToggled --> [*]
    }

    Light --> Light: toggleTheme()
    Dark --> Dark: toggleTheme()
```

---

## 5. `HomeClient.handleSearch` — busca de podcasts

```mermaid
flowchart TD
    A[User pressiona Enter / click Search] --> B[handleSearch async]
    B --> C[trim query]
    C --> D[setSearchTerm trimmed]
    D --> E{trimmed é vazio?}
    E -->|Sim| F[setPodcasts[]<br/>return early]
    E -->|Não| G[setIsSearchingPodcasts true]
    G --> H[fetchPodcasts trimmed]
    H --> I{sucesso?}
    I -->|Sim| J[setPodcasts res.results]
    I -->|Não| K[console.error<br/>setPodcasts[]]
    J --> L[setIsSearchingPodcasts false]
    K --> L
    L --> M[Re-render: grid de PodcastCards]
```

---

## 6. `lib/api.ts` — 3 endpoints

```mermaid
graph LR
    A[lib/api.ts] --> B[fetchEpisodes<br/>GET /api/episodes/]
    A --> C[fetchPodcasts<br/>GET /api/podcasts/]
    A --> D[addPodcast<br/>POST /api/podcasts/]

    B --> B1[params: q + page]
    B1 --> B2[DRF SearchFilter<br/>search_fields=title]

    C --> C1[params: search + page]
    C1 --> C2[DRF SearchFilter<br/>search_fields=name]

    D --> D1[body: name, feed]
    D1 --> D2[retorna AddPodcastResponse<br/>status: created|existing|error]

    B --> E[EpisodesResponse<br/>count, next, previous, results: Episode]
    C --> F[PodcastsResponse<br/>count, next, previous, results: Podcast]
    D --> G[AddPodcastResponse<br/>id?, status, message?]
```

---

## 7. AuthContext — providers tree

```mermaid
graph TB
    A[layout.tsx] --> B[body]
    B --> C[ThemeProvider]
    C --> D[children]
    D --> E[...]

    C -.uses.-> F[ThemeContext<br/>useState theme]
    F --> G[useTheme hook]

    E --> H[AuthProvider]
    H -.uses.-> I[AuthContext<br/>useState user]
    I --> J[useAuth hook]

    J --> K[Navbar]
    J --> L[AddPodcastPage]
    J --> M[ForbiddenPage]

    K --> K1[Mostra 'Add Podcast' se role editor/admin]
    L --> L1[Guard de role]
    M --> M1[Mostra role label PT-BR]

    style I fill:#fef3c7
    style F fill:#dbeafe
```

---

## 8. Fluxo de dados: Home → API → Backend

```mermaid
sequenceDiagram
    participant U as User
    participant HC as HomeClient
    participant SH as SearchHero
    participant API as fetchPodcasts (lib/api)
    participant BE as Django Backend
    participant EL as EpisodeList
    participant FE as fetchEpisodes (lib/api)

    U->>SH: digita "python"
    SH->>HC: onQueryChange("python")
    U->>SH: pressiona Enter
    SH->>HC: onSearch()
    HC->>HC: setSearchTerm("python")
    HC->>API: fetchPodcasts("python")
    API->>BE: GET /api/podcasts/?search=python
    BE-->>API: PodcastsResponse
    API-->>HC: {results: Podcast[]}
    HC->>HC: setPodcasts(results)
    Note over HC: Re-render com grid de PodcastCards

    par Episodes também carregam
        HC->>EL: <EpisodeList searchTerm="python"/>
        EL->>FE: fetchEpisodes("python", 1)
        FE->>BE: GET /api/episodes/?q=python&page=1
        BE-->>FE: EpisodesResponse
        FE-->>EL: {results, next, ...}
        EL->>EL: setEpisodes(results)
        Note over EL: Re-render com grid/lista
    end
```
