# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Health Check Externo Bloqueado (HTTP 403)
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to the concrete failing case — step "Health check" in `deploy-production.yml` without `continue-on-error: true`
  - Inspect `.github/workflows/deploy-production.yml` and assert that the step "Health check" does NOT have `continue-on-error: true` (confirms bug condition: `step_config.continue_on_error = false`)
  - Inspect the script of the "Health check" step and assert that it contains `exit 1` — confirming that any non-200 HTTP status (including 403) causes the job to fail
  - Compare with `.github/workflows/deploy-staging.yml` and assert that the staging "Health check" step DOES have `continue-on-error: true` — confirming the asymmetry that causes the bug
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct — it proves the bug exists: `deploy-production.yml` has no `continue-on-error: true` and has `exit 1`)
  - Document counterexamples found: `deploy-production.yml` step "Health check" — absence of `continue-on-error: true` + `exit 1` in script = job fails with HTTP 403
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Detecção de Falhas Reais Permanece Inalterada
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: the step "Deploy to production" in `deploy-production.yml` contains an internal health check loop (12 attempts, `curl http://localhost:8000/health/` inside the container via SSH) — this is the authoritative health check
  - Observe: the step "Rollback on failure" uses `if: failure()` — it is triggered by failures in ANY preceding step, not specifically the "Health check" step
  - Observe: the step "Deployment summary" uses `if: success()` — it runs when all preceding steps succeed or have `continue-on-error: true`
  - Write property-based test: for all deploy scenarios where the backend is genuinely unavailable (container crashed, port not responding), the step "Deploy to production" SHALL detect the failure internally via SSH and trigger rollback — regardless of `continue-on-error: true` on the "Health check" step
  - Write property-based test: for all values of `BACKEND_STATUS` (200, 403, 000, 500, etc.), the corrected "Health check" step SHALL log a message and continue without failing the job
  - Verify that `deploy-staging.yml` is not modified and continues to work with `continue-on-error: true`
  - Verify tests pass on UNFIXED code (these assertions are about the internal SSH step, which is not changed)
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve — internal SSH health check and rollback logic are intact)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.4_

- [x] 3. Fix for Health Check externo bloqueado por Cloudflare/Nginx (HTTP 403)

  - [x] 3.1 Implement the fix in `.github/workflows/deploy-production.yml`
    - Add `continue-on-error: true` to the "Health check" step
    - Replace the current script (with `exit 1`) with informative messages that explain the 403 is a false positive due to Cloudflare blocking direct access from GitHub Actions runners
    - Preserve the `sleep 20` wait at the beginning of the step
    - Preserve the retry logic structure (3 attempts) but without `exit 1` — log warnings instead
    - Align the behavior with `deploy-staging.yml` which already has `continue-on-error: true`
    - Do NOT modify any other step in `deploy-production.yml` (backup, copy files, deploy, rollback, summary)
    - Do NOT modify `deploy-staging.yml`, `ci.yml`, or `release.yml`
    - _Bug_Condition: `isBugCondition_HealthCheck(step_config)` where `step_config.continue_on_error = false` AND `step_config.workflow = "deploy-production.yml"`_
    - _Expected_Behavior: step "Health check" logs informative warning and continues deploy without failing the job when HTTP 403 is received from Cloudflare/Nginx_
    - _Preservation: step "Deploy to production" internal SSH health check (12 attempts) remains unchanged and continues to detect real backend failures; rollback (`if: failure()`) continues to be triggered by "Deploy to production" failures_
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.4_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Health Check Externo Não Interrompe Deploy
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Inspect `.github/workflows/deploy-production.yml` and assert that the step "Health check" NOW has `continue-on-error: true`
    - Inspect the script and assert that it does NOT contain `exit 1`
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed — `continue-on-error: true` is present and `exit 1` is removed)
    - _Requirements: 2.1, 2.2_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Detecção de Falhas Reais Permanece Inalterada
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - Verify that the step "Deploy to production" (SSH internal health check) is unchanged in `deploy-production.yml`
    - Verify that the step "Rollback on failure" (`if: failure()`) is unchanged
    - Verify that the step "Deployment summary" (`if: success()`) is unchanged
    - Verify that `deploy-staging.yml`, `ci.yml`, and `release.yml` are not modified
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions — internal health check, rollback, and summary logic are intact)
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - Verify final state of `.github/workflows/deploy-production.yml`:
    - Step "Health check" has `continue-on-error: true`
    - Script does not contain `exit 1`
    - All other steps are unchanged
  - Verify that no other workflow files were modified
  - Confirm Bug 2 (Node.js 20 deprecation warning) requires no code changes — all workflows already use updated action versions (`actions/checkout@v5`, `webfactory/ssh-agent@v0.10.0`, `actions/setup-python@v6`, `actions/setup-node@v6`)
