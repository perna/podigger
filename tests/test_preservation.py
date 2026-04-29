"""
Preservation Property Tests — CI/CD Deploy Fix

Validates: Requirements 3.1, 3.2, 3.4

These tests verify that existing correct behaviors are preserved after the fix.
They MUST PASS on unfixed code — they assert baseline behavior that should not change.

Preservation properties:
  - The step "Deploy to production" contains an internal SSH health check (12 attempts,
    `curl http://localhost:8000/health/` inside the container) — this is the authoritative check.
  - The step "Rollback on failure" uses `if: failure()` — triggered by failures in ANY
    preceding step, not specifically the "Health check" step.
  - The step "Deployment summary" uses `if: success()`.
  - `deploy-staging.yml` is not modified and continues to work with `continue-on-error: true`.
"""

import re
import yaml
import pytest
from pathlib import Path
from hypothesis import given, settings, HealthCheck
from hypothesis import strategies as st

PRODUCTION_WORKFLOW = Path(".github/workflows/deploy-production.yml")
STAGING_WORKFLOW = Path(".github/workflows/deploy-staging.yml")


def load_workflow(path: Path) -> dict:
    with open(path, "r") as f:
        return yaml.safe_load(f)


def find_step(workflow: dict, step_name: str) -> dict | None:
    """Find a step by name across all jobs in a workflow."""
    for job in workflow.get("jobs", {}).values():
        for step in job.get("steps", []):
            if step.get("name") == step_name:
                return step
    return None


def get_all_steps(workflow: dict) -> list[dict]:
    """Return all steps across all jobs in a workflow."""
    steps = []
    for job in workflow.get("jobs", {}).values():
        steps.extend(job.get("steps", []))
    return steps


class TestPreservationInternalHealthCheck:
    """
    Preservation Property 1: Internal SSH Health Check Remains Intact

    The step "Deploy to production" contains an authoritative internal health check
    loop (12 attempts, curl http://localhost:8000/health/ inside the container via SSH).
    This must remain unchanged regardless of what happens to the external "Health check" step.

    Validates: Requirements 3.1
    """

    def test_deploy_to_production_step_exists(self):
        """
        Assert that the step "Deploy to production" exists in deploy-production.yml.

        This step is the authoritative health check — it must not be removed or renamed.

        Validates: Requirements 3.1
        """
        workflow = load_workflow(PRODUCTION_WORKFLOW)
        step = find_step(workflow, "Deploy to production")

        assert step is not None, (
            "Step 'Deploy to production' not found in deploy-production.yml. "
            "This step contains the authoritative internal SSH health check and must not be removed."
        )

    def test_deploy_to_production_contains_internal_health_check_loop(self):
        """
        Assert that the "Deploy to production" step contains an internal health check loop
        with 12 attempts using curl http://localhost:8000/health/ inside the container via SSH.

        This is the authoritative health check that detects real backend failures.
        It must remain intact regardless of changes to the external "Health check" step.

        Validates: Requirements 3.1
        """
        workflow = load_workflow(PRODUCTION_WORKFLOW)
        step = find_step(workflow, "Deploy to production")

        assert step is not None, "Step 'Deploy to production' not found in deploy-production.yml"

        script = step.get("run", "")

        # Verify the internal health check loop exists (12 attempts)
        assert "{1..12}" in script, (
            "Step 'Deploy to production' does not contain the internal health check loop "
            "with 12 attempts (`for i in {1..12}`). "
            "This loop is the authoritative health check that detects real backend failures."
        )

        # Verify it checks localhost:8000/health/ (internal container check via SSH)
        assert "localhost:8000/health/" in script, (
            "Step 'Deploy to production' does not contain `curl http://localhost:8000/health/` "
            "inside the container. This internal check is the authoritative health verification "
            "and must remain intact."
        )

    def test_deploy_to_production_internal_check_fails_on_unavailability(self):
        """
        Assert that the "Deploy to production" step exits with failure (exit 1) when
        the backend fails to become healthy after 12 attempts.

        This ensures that genuine backend unavailability (container crashed, port not responding)
        is still detected and causes the job to fail, triggering rollback.

        Validates: Requirements 3.1
        """
        workflow = load_workflow(PRODUCTION_WORKFLOW)
        step = find_step(workflow, "Deploy to production")

        assert step is not None, "Step 'Deploy to production' not found in deploy-production.yml"

        script = step.get("run", "")

        # The internal health check must exit 1 when backend is unavailable
        # (after exhausting all 12 attempts)
        assert "exit 1" in script, (
            "Step 'Deploy to production' does not contain `exit 1` for when the backend "
            "fails to become healthy. Without this, genuine backend failures would not "
            "trigger rollback. The internal SSH health check must fail the job when the "
            "backend is genuinely unavailable."
        )

        # Verify the failure message is present
        assert "Backend failed to become healthy" in script or "failed to become healthy" in script.lower(), (
            "Step 'Deploy to production' does not contain a failure message when the backend "
            "fails to become healthy after 12 attempts."
        )

    def test_deploy_to_production_does_not_have_continue_on_error(self):
        """
        Assert that the "Deploy to production" step does NOT have continue-on-error: true.

        This step must fail the job when the backend is genuinely unavailable.
        Adding continue-on-error to this step would prevent rollback from being triggered.

        Validates: Requirements 3.1
        """
        workflow = load_workflow(PRODUCTION_WORKFLOW)
        step = find_step(workflow, "Deploy to production")

        assert step is not None, "Step 'Deploy to production' not found in deploy-production.yml"

        coe = step.get("continue-on-error")
        assert coe is not True, (
            f"Step 'Deploy to production' has `continue-on-error: true` (found: {coe!r}). "
            "This step must NOT have continue-on-error because it contains the authoritative "
            "internal health check — if it fails, the job must fail to trigger rollback."
        )


class TestPreservationRollbackLogic:
    """
    Preservation Property 2: Rollback Logic Remains Intact

    The step "Rollback on failure" uses `if: failure()` — it is triggered by failures
    in ANY preceding step, not specifically the "Health check" step.
    This must remain unchanged.

    Validates: Requirements 3.1, 3.2
    """

    def test_rollback_step_exists(self):
        """
        Assert that the step "Rollback on failure" exists in deploy-production.yml.

        Validates: Requirements 3.1
        """
        workflow = load_workflow(PRODUCTION_WORKFLOW)
        step = find_step(workflow, "Rollback on failure")

        assert step is not None, (
            "Step 'Rollback on failure' not found in deploy-production.yml. "
            "This step is critical for automatic rollback on deployment failures."
        )

    def test_rollback_step_uses_if_failure(self):
        """
        Assert that the "Rollback on failure" step uses `if: failure()`.

        This condition triggers rollback when ANY preceding step fails — including
        "Deploy to production" when the backend is genuinely unavailable.
        It must NOT be changed to depend only on a specific step.

        Validates: Requirements 3.1
        """
        workflow = load_workflow(PRODUCTION_WORKFLOW)
        step = find_step(workflow, "Rollback on failure")

        assert step is not None, "Step 'Rollback on failure' not found in deploy-production.yml"

        condition = step.get("if", "")
        assert "failure()" in str(condition), (
            f"Step 'Rollback on failure' does not use `if: failure()` "
            f"(found: {condition!r}). "
            "This condition must remain as `failure()` to trigger rollback when ANY "
            "preceding step fails (including 'Deploy to production' when backend is unavailable)."
        )

    def test_rollback_triggered_by_deploy_step_failure_not_health_check(self):
        """
        Assert that the rollback is triggered by `if: failure()` (any step failure),
        which means "Deploy to production" failing (genuine backend unavailability)
        will trigger rollback — regardless of `continue-on-error: true` on "Health check".

        The key insight: `continue-on-error: true` on "Health check" does NOT prevent
        rollback when "Deploy to production" fails. The `if: failure()` condition on
        "Rollback on failure" responds to job-level failure, which is set by "Deploy to
        production" failing (not by "Health check" with continue-on-error).

        Validates: Requirements 3.1
        """
        workflow = load_workflow(PRODUCTION_WORKFLOW)

        deploy_step = find_step(workflow, "Deploy to production")
        rollback_step = find_step(workflow, "Rollback on failure")

        assert deploy_step is not None, "Step 'Deploy to production' not found"
        assert rollback_step is not None, "Step 'Rollback on failure' not found"

        # "Deploy to production" must NOT have continue-on-error (it must be able to fail the job)
        deploy_coe = deploy_step.get("continue-on-error")
        assert deploy_coe is not True, (
            "Step 'Deploy to production' has continue-on-error: true, which would prevent "
            "it from triggering rollback when the backend is genuinely unavailable."
        )

        # "Rollback on failure" must use if: failure()
        rollback_condition = str(rollback_step.get("if", ""))
        assert "failure()" in rollback_condition, (
            f"Step 'Rollback on failure' condition is {rollback_condition!r}, not `failure()`. "
            "Rollback must be triggered by any step failure."
        )

        # "Deploy to production" must contain exit 1 (to fail the job on genuine unavailability)
        deploy_script = deploy_step.get("run", "")
        assert "exit 1" in deploy_script, (
            "Step 'Deploy to production' does not contain `exit 1`. "
            "Without this, genuine backend failures would not trigger rollback."
        )


class TestPreservationDeploymentSummary:
    """
    Preservation Property 3: Deployment Summary Logic Remains Intact

    The step "Deployment summary" uses `if: success()` — it runs when all preceding
    steps succeed or have `continue-on-error: true`.

    Validates: Requirements 3.2
    """

    def test_deployment_summary_step_exists(self):
        """
        Assert that the step "Deployment summary" exists in deploy-production.yml.

        Validates: Requirements 3.2
        """
        workflow = load_workflow(PRODUCTION_WORKFLOW)
        step = find_step(workflow, "Deployment summary")

        assert step is not None, (
            "Step 'Deployment summary' not found in deploy-production.yml."
        )

    def test_deployment_summary_uses_if_success(self):
        """
        Assert that the "Deployment summary" step uses `if: success()`.

        This ensures the summary is only generated when the deployment succeeds.
        After the fix, with `continue-on-error: true` on "Health check", the summary
        will still run correctly when the deploy succeeds (even if health check returns 403).

        Validates: Requirements 3.2
        """
        workflow = load_workflow(PRODUCTION_WORKFLOW)
        step = find_step(workflow, "Deployment summary")

        assert step is not None, "Step 'Deployment summary' not found in deploy-production.yml"

        condition = step.get("if", "")
        assert "success()" in str(condition), (
            f"Step 'Deployment summary' does not use `if: success()` "
            f"(found: {condition!r}). "
            "This condition must remain as `success()` to generate the summary only "
            "when the deployment succeeds."
        )

    def test_deployment_summary_contains_frontend_and_backend_links(self):
        """
        Assert that the "Deployment summary" step contains links to both frontend and backend.

        Validates: Requirements 3.2
        """
        workflow = load_workflow(PRODUCTION_WORKFLOW)
        step = find_step(workflow, "Deployment summary")

        assert step is not None, "Step 'Deployment summary' not found in deploy-production.yml"

        script = step.get("run", "")

        assert "podigger.perna.app" in script, (
            "Step 'Deployment summary' does not contain a link to the frontend "
            "(podigger.perna.app). The summary must include frontend and backend links."
        )

        assert "api-podigger.perna.app" in script, (
            "Step 'Deployment summary' does not contain a link to the backend "
            "(api-podigger.perna.app). The summary must include frontend and backend links."
        )


class TestPreservationStagingWorkflow:
    """
    Preservation Property 4: Staging Workflow Remains Unchanged

    `deploy-staging.yml` is NOT modified and continues to work with
    `continue-on-error: true` on the "Health check" step.

    Validates: Requirements 3.4
    """

    def test_staging_health_check_has_continue_on_error(self):
        """
        Assert that deploy-staging.yml "Health check" step has `continue-on-error: true`.

        This is the reference behavior that production should match after the fix.
        Staging must not be modified.

        Validates: Requirements 3.4
        """
        workflow = load_workflow(STAGING_WORKFLOW)
        step = find_step(workflow, "Health check")

        assert step is not None, (
            "Step 'Health check' not found in deploy-staging.yml"
        )

        assert step.get("continue-on-error") is True, (
            f"deploy-staging.yml 'Health check' step does NOT have `continue-on-error: true` "
            f"(found: {step.get('continue-on-error')!r}). "
            "Staging workflow must not be modified — it already has the correct behavior."
        )

    def test_staging_health_check_script_does_not_contain_exit_1(self):
        """
        Assert that the "Health check" script in deploy-staging.yml does NOT contain `exit 1`.

        Staging already has the correct behavior (no exit 1, informative messages).
        This must remain unchanged.

        Validates: Requirements 3.4
        """
        workflow = load_workflow(STAGING_WORKFLOW)
        step = find_step(workflow, "Health check")

        assert step is not None, "Step 'Health check' not found in deploy-staging.yml"

        script = step.get("run", "")
        assert "exit 1" not in script, (
            "deploy-staging.yml 'Health check' step contains `exit 1`. "
            "Staging already has the correct behavior and must not be modified."
        )

    def test_staging_rollback_uses_if_failure(self):
        """
        Assert that deploy-staging.yml "Rollback on failure" step uses `if: failure()`.

        Validates: Requirements 3.4
        """
        workflow = load_workflow(STAGING_WORKFLOW)
        step = find_step(workflow, "Rollback on failure")

        assert step is not None, "Step 'Rollback on failure' not found in deploy-staging.yml"

        condition = step.get("if", "")
        assert "failure()" in str(condition), (
            f"deploy-staging.yml 'Rollback on failure' does not use `if: failure()` "
            f"(found: {condition!r})."
        )

    def test_staging_deployment_summary_uses_if_success(self):
        """
        Assert that deploy-staging.yml "Deployment summary" step uses `if: success()`.

        Validates: Requirements 3.4
        """
        workflow = load_workflow(STAGING_WORKFLOW)
        step = find_step(workflow, "Deployment summary")

        assert step is not None, "Step 'Deployment summary' not found in deploy-staging.yml"

        condition = step.get("if", "")
        assert "success()" in str(condition), (
            f"deploy-staging.yml 'Deployment summary' does not use `if: success()` "
            f"(found: {condition!r})."
        )


class TestPreservationPropertyBased:
    """
    Property-Based Preservation Tests

    These tests use Hypothesis to verify preservation properties across many inputs.

    Validates: Requirements 3.1, 3.2, 3.4
    """

    @given(
        backend_status=st.sampled_from(["200", "403", "000", "500", "502", "503", "404", "301"])
    )
    @settings(suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_staging_health_check_continues_for_all_backend_statuses(self, backend_status):
        """
        Property: For all values of BACKEND_STATUS (200, 403, 000, 500, etc.),
        the staging "Health check" step (which already has `continue-on-error: true`)
        SHALL log a message and continue without failing the job.

        This property verifies the reference behavior in staging that production
        should match after the fix. The staging workflow already handles all HTTP
        status codes gracefully — it logs a warning and continues.

        The key structural invariant: `continue-on-error: true` + no `exit 1` in script
        means the step never fails the job regardless of BACKEND_STATUS.

        Validates: Requirements 3.4

        **Validates: Requirements 3.4**
        """
        workflow = load_workflow(STAGING_WORKFLOW)
        step = find_step(workflow, "Health check")

        assert step is not None, "Step 'Health check' not found in deploy-staging.yml"

        # Structural invariant: continue-on-error: true means the step never fails the job
        assert step.get("continue-on-error") is True, (
            f"deploy-staging.yml 'Health check' does not have `continue-on-error: true`. "
            f"For BACKEND_STATUS={backend_status!r}, the step would fail the job."
        )

        # Structural invariant: no exit 1 means the script never explicitly fails
        script = step.get("run", "")
        assert "exit 1" not in script, (
            f"deploy-staging.yml 'Health check' contains `exit 1`. "
            f"For BACKEND_STATUS={backend_status!r}, the script would exit with failure."
        )

        # The script must contain logging for non-200 statuses (informative messages)
        # This verifies the script handles all status codes by logging, not failing
        assert "⚠️" in script or "warning" in script.lower() or "false positive" in script.lower(), (
            f"deploy-staging.yml 'Health check' script does not contain informative warning messages. "
            f"For BACKEND_STATUS={backend_status!r}, the script should log a warning instead of failing."
        )

    @given(
        attempt_number=st.integers(min_value=1, max_value=12)
    )
    @settings(suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_deploy_to_production_internal_check_covers_all_attempts(self, attempt_number):
        """
        Property: For all deploy scenarios where the backend is genuinely unavailable
        (container crashed, port not responding), the step "Deploy to production" SHALL
        detect the failure internally via SSH — regardless of `continue-on-error: true`
        on the "Health check" step.

        This property verifies that the internal health check loop (12 attempts) is
        structurally present and will detect genuine backend failures at any attempt
        number from 1 to 12.

        Validates: Requirements 3.1

        **Validates: Requirements 3.1**
        """
        workflow = load_workflow(PRODUCTION_WORKFLOW)
        step = find_step(workflow, "Deploy to production")

        assert step is not None, "Step 'Deploy to production' not found in deploy-production.yml"

        script = step.get("run", "")

        # The loop must cover all 12 attempts
        assert "{1..12}" in script, (
            f"Step 'Deploy to production' does not contain a 12-attempt loop (`{{1..12}}`). "
            f"At attempt {attempt_number}, genuine backend unavailability would not be detected."
        )

        # The loop must check localhost:8000/health/ (internal container check)
        assert "localhost:8000/health/" in script, (
            f"Step 'Deploy to production' does not check `localhost:8000/health/` internally. "
            f"At attempt {attempt_number}, genuine backend unavailability would not be detected."
        )

        # The loop must exit 1 when all attempts are exhausted (genuine failure)
        assert "exit 1" in script, (
            f"Step 'Deploy to production' does not contain `exit 1` for genuine failures. "
            f"At attempt {attempt_number}, genuine backend unavailability would not trigger rollback."
        )

        # The step must NOT have continue-on-error (it must be able to fail the job)
        assert step.get("continue-on-error") is not True, (
            f"Step 'Deploy to production' has `continue-on-error: true`. "
            f"At attempt {attempt_number}, genuine backend unavailability would not trigger rollback."
        )
