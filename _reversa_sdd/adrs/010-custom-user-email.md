# ADR-010: Custom User Model com Email como USERNAME_FIELD

> Status: Aceito
> Data: 2026-05-01 (introduzido com `accounts.User` no commit `94ca2f2`)

## Contexto e problema

Django, por padrão, usa `username` como identificador único de usuário. Para um agregador de podcasts (produto B2C, não B2B interno), o `email` é o identificador natural — é o que o usuário lembra e é o canal de comunicação primário.

## Decisão

Criar modelo `User` custom herdando de `AbstractBaseUser` e `PermissionsMixin`, com `USERNAME_FIELD = "email"`.

### Implementação

```python
# backend/accounts/models.py
class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("O email é obrigatório")
        user = self.model(email=self.normalize_email(email), **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        # validações rígidas
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="reader")
    approval_status = models.CharField(max_length=20, default="pending")
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []  # só email + password

    objects = UserManager()
```

🟢 Fonte: `backend/accounts/models.py:1-100`; `backend/config/settings.py:52` (`AUTH_USER_MODEL = "accounts.User"`).

### Decisões derivadas

- 🟢 `RegisterSerializer` herda de `create_user` com `role="reader"` e `approval_status="pending"` explícitos.
- 🟢 `EmailTokenObtainPairSerializer` usa `username_field = "email"` (config SimpleJWT).
- 🟢 `JWT` embute `email` e `role` como claims custom (visíveis ao frontend sem re-fetch).

## Consequências

### Positivas
- 🟢 **UX natural** — usuário registra com email, faz login com email.
- 🟢 **Sem coluna `username` redundante** (muitos sistemas têm ambos e o username vira lixo).
- 🟢 **Migração de username→email no futuro** é trivial (não há coluna herdada para limpar).
- 🟢 **Compatível com Django Admin** — email aparece como identificador.

### Negativas
- 🔴 **Custom User Model é "sticky"** — uma vez definido em produção, mudar depois é uma migração de banco de dados complexa.
- 🟡 **Email case-sensitivity** precisa de normalização explícita (`self.normalize_email`) — o Django faz isso nativamente, mas é uma armadilha comum.
- 🟡 **Perde usernames amigáveis** ("@fulano") — mas não era requisito do produto.

## Alternativas consideradas

1. **Manter `AbstractUser` padrão (com username)**: rejeitada. Traria campo `username` redundante.
2. **Email + username opcionais**: rejeitada. Complexidade de UX (qual usar no login?).
3. **Login social (Google/Apple) sem email local**: rejeitada. Exigiria OAuth provider; não era prioridade.

## Notas de operação

- 🟢 **AUTH_USER_MODEL = "accounts.User"** está definido em `backend/config/settings.py:52` desde o início do app accounts.
- 🟢 O `AUTHENTICATION_BACKENDS` padrão do Django (`ModelBackend`) continua funcionando.
- 🟢 O `CookieJWTAuthentication` lê o claim `email` do JWT para exibir na UI.
