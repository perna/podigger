# Fluxograma — Módulo `accounts`

> Gerado pelo Arqueólogo em 2026-06-04

## Fluxo: Login (`POST /api/auth/token/`)

```mermaid
sequenceDiagram
    participant C as Cliente
    participant V as TokenObtainCookieView
    participant S as EmailTokenObtainPairSerializer
    participant U as UserManager
    participant DB as PostgreSQL

    C->>V: POST {email, password}
    V->>V: throttling check (AnonRateThrottle, scope=login)
    V->>S: validate({email, password})
    S->>U: authenticate(email, password)
    U->>DB: SELECT user WHERE email=...
    alt credenciais inválidas
        DB-->>U: not found
        U-->>S: raise AuthenticationFailed
        S-->>V: raise AuthenticationFailed
        V-->>C: 401 {"detail": "Credenciais inválidas."}
    else conta pending
        DB-->>U: user (approval_status=pending)
        U-->>S: success
        S->>S: if user.approval_status != "approved"
        S-->>V: raise PermissionDenied
        V-->>C: 403 {"detail": "Sua conta aguarda aprovação de um administrador."}
    else sucesso
        DB-->>U: user (approved)
        U-->>S: success
        S->>S: get_token(user) com claims {role, email}
        S-->>V: {access, refresh, role, email}
        V->>V: set_cookie(access_token, 5min, HttpOnly)
        V->>V: set_cookie(refresh_token, 24h, HttpOnly, path=/api/auth/token/refresh/)
        V-->>C: 200 {role, email}
    end
```

## Fluxo: Registro (`POST /api/auth/register/`)

```mermaid
sequenceDiagram
    participant C as Cliente
    participant V as RegisterView
    participant S as RegisterSerializer
    participant U as UserManager
    participant DB as PostgreSQL

    C->>V: POST {email, password}
    V->>V: throttling check (scope=register)
    V->>S: is_valid()
    alt password < 8 chars
        S-->>V: ValidationError
        V-->>C: 400 {"password": ["A senha deve ter no mínimo 8 caracteres."]}
    else email já cadastrado (IntegrityError)
        S->>U: create_user(...)
        U->>DB: INSERT
        DB-->>U: IntegrityError
        U-->>S: raise IntegrityError
        V-->>C: 400 {"detail": "Este email já está cadastrado."}
    else sucesso
        S->>U: create_user(approval_status="pending", role="reader")
        U->>U: normalize_email, set_password (hash)
        U->>DB: INSERT
        DB-->>U: ok
        U-->>S: user
        V-->>C: 201 {email}
    end
```

## Fluxo: Refresh de token (`POST /api/auth/token/refresh/`)

```mermaid
sequenceDiagram
    participant C as Cliente
    participant V as TokenRefreshCookieView
    participant P as SimpleJWT parent
    participant DB as PostgreSQL

    C->>V: POST (cookie: refresh_token)
    V->>V: refresh_token = request.COOKIES.get("refresh_token")
    alt cookie ausente
        V-->>C: 401 {"detail": "Token de autenticação não fornecido ou inválido."}
    else cookie presente
        V->>V: request.data["refresh"] = cookie_value
        V->>P: super().post()
        alt token inválido/expirado
            P-->>V: raise (InvalidToken, TokenError)
            V-->>C: 401 {"detail": "Token de autenticação expirado."}
        else sucesso
            P-->>V: {access: "..."}
            V->>V: set_cookie(access_token, 5min, HttpOnly)
            V-->>C: 200 {}
        end
    end
```

## Fluxo: Aprovação de usuário (`POST /api/auth/users/{pk}/approve/`)

```mermaid
sequenceDiagram
    participant A as Admin
    participant V as UserApproveView
    participant P as IsAdminRole
    participant DB as PostgreSQL

    A->>V: POST (cookie: access_token)
    V->>P: has_permission()
    alt não é admin
        P-->>V: False
        V-->>A: 403 Forbidden
    else é admin
        P-->>V: True
        V->>DB: User.objects.get(pk=pk)
        alt user não existe
            DB-->>V: DoesNotExist
            V-->>A: 404 {"detail": "Usuário não encontrado."}
        else sucesso
            DB-->>V: user
            V->>V: user.approval_status = "approved"
            V->>DB: user.save()
            V-->>A: 200 UserSerializer.data
        end
    end
```

## Máquina de estados: `approval_status`

```mermaid
stateDiagram-v2
    [*] --> pending: create_user (default)
    pending --> approved: UserApproveView.post
    pending --> [*]: nunca ativado, user não loga
    approved --> [*]: conta ativa, pode logar

    note right of pending
        role = "reader" por default
        login retorna 403
    end note

    note right of approved
        Login retorna 200 + tokens
        role pode ser alterado
        via UserRoleUpdateView
    end note
```

## Máquina de estados: `role`

```mermaid
stateDiagram-v2
    [*] --> reader: create_user (default)
    [*] --> admin: create_superuser
    [*] --> editor: create_user (extra_fields)
    reader --> editor: UserRoleUpdateView.patch
    reader --> admin: UserRoleUpdateView.patch
    editor --> reader: UserRoleUpdateView.patch
    editor --> admin: UserRoleUpdateView.patch
    admin --> editor: UserRoleUpdateView.patch
    admin --> reader: UserRoleUpdateView.patch
```
