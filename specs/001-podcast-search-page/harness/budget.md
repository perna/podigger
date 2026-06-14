# Harness Budget Ledger

## Mission
1. O idioma da documentação do speckit deve ser em pt-br

## Budget
| Resource | Budget | Spent | Remaining |
|----------|-------:|------:|----------:|
| searches | 30 | 2 | 28 |
| inspections | 40 | 6 | 34 |
| verifications | 20 | 0 | 20 |

Context render cap: 4000 tokens per iteration.

## Stop conditions
- Budget exhausted in any resource required for the next action.
- Marginal gain: 3 consecutive actions produced no new curated evidence.
- Mission answered AND every `critical` claim has a `verified` record.

## Action log
| # | Action | Target | Cost | New evidence? |
| 1 | SEARCH | specs/**/*.md + .specify/**/* | 1 search | No |
| 2 | INSPECT | C001 (spec.md) | 1 inspection | No |
| 3 | INSPECT | C002 (plan.md) | 1 inspection | No |
| 4 | INSPECT | C003 (data-model.md) | 1 inspection | No |
| 5 | INSPECT | C004 (research.md) | 1 inspection | No |
| 6 | INSPECT | C005 (quickstart.md) | 1 inspection | No |
| 7 | INSPECT | C006 (checklists/requirements.md) | 1 inspection | No |
| 8 | SEARCH | .specify/templates + contracts | 1 search | Yes |
| 9 | CURATE | E001-E004 promoted | — | Yes |
