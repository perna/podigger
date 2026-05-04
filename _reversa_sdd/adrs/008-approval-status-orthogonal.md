# ADR-008: `approval_status` Ortogonal a `is_active`

> Status: Aceito (padrão herdado)
> Data: 2026-05-01 (modelo `User` custom criado no commit `94ca2f2`)

## Contexto e problema

Django fornece `is_active` como flag built-in para "conta pode logar". O podigger precisa de um **conceito adicional**: "conta foi revisada por admin" (vs. "conta ainda na fila de aprovação"). São ortogonais:

- Uma conta pode estar `is_active=True` e `approval_status="pending"` (criada, mas não revisada).
- Uma conta `is_active=False` e `approval_status="approved"` (baneada ou removida por admin).
- Uma conta `is_active=True` e `approval_status="approved"` (estado normal).

## Decisão

Criar campo custom `approval_status` no modelo `User`, **separado** de `is_active`.

### Schema

```python
# backend/accounts/models.py
class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="reader")
    approval_status = models.CharField(
        max_length=20,
        choices=APPROVAL_STATUS_CHOICES,  # ("pending", "approved")
        default="pending",
    )
    is_active = models.BooleanField(default=True)  # Django built-in
    is_staff = models.BooleanField(default=False)
    # ...
```

### Comportamento

| `is_active` | `approval_status` | Pode logar? |
|-------------|-------------------|-------------|
| `True` | `pending` | ❌ (PermissionDenied) |
| `True` | `approved` | ✅ |
| `False` | `pending` | ❌ (sem chance) |
| `False` | `approved` | ❌ (baneada) |

🟢 Fonte: `backend/accounts/models.py:55-83`; `backend/accounts/serializers.py:32-35`.

## Consequências

### Positivas
- 🟢 **Semântica clara** — admin pode desativar sem afetar a fila de aprovação.
- 🟢 **Aprovação é um evento** que pode ser logado separadamente.
- 🟢 **Re-ativação** (de banned → approved) preserva o histórico de aprovação.
- 🟢 **Compatibilidade com Django Admin** — `is_active` ainda funciona normalmente.

### Negativas
- 🔴 **Sem `db.CheckConstraint`** garantindo que `role ∈ {admin, editor, reader}` ou `approval_status ∈ {pending, approved}`. A validação fica apenas no Python (validação no `UserRoleUpdateView`).
- 🟡 **Duplicação conceitual** — admin pode confundir "desativar" (is_active) com "rejeitar" (manualmente voltar para pending? não há UI).
- 🟡 **Sem UI para "rejeitar"** — só é possível aprovar, não rejeitar (o estado `pending` é absorvido por "não fazer nada").

## Alternativas consideradas

1. **Usar `is_active` para tudo**: rejeitada. Colapsa 2 estados em 1; perderia a noção de "aguardando aprovação".
2. **Renomear `is_active` para `is_banned`**: rejeitada. Quebraria integrações com Django Admin e libs externas.
3. **Adicionar `rejected` como terceiro estado**: não implementada. Considerada para futuro se houver fluxo de "rejeição" (com motivo).

## Notas de operação

- 🟢 O serializer de login é o ponto único de enforcement: `EmailTokenObtainPairSerializer.validate` checa `approval_status == "approved"` antes de emitir tokens.
- 🟢 O fluxo de `is_active` continua sendo gerenciado pelo Django Admin padrão.
