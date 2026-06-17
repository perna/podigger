# Data Model: Fix Backend Lint

**Feature**: 001-fix-backend-lint
**Date**: 2026-06-17

## Overview

This feature is a configuration/infrastructure change, not a data feature. No new entities or data model changes are introduced.

## Configuration Entities

### Ruff Configuration

| Property | Description |
|----------|-------------|
| Location | `ruff.toml` (root) |
| Target | Python 3.12 |
| Line length | 88 characters |
| Quote style | Double quotes |
| Indent style | Spaces |

### CI Pipeline Configuration

| Property | Description |
|----------|-------------|
| File | `.github/workflows/ci.yml` |
| Trigger | PR to main/develop, push to main/develop |
| Lint steps | `ruff check .` + `ruff format --check .` |

## State Transitions

None - this feature does not introduce stateful entities.