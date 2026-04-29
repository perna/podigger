"""
Bug Condition Exploration Test — CI/CD Deploy Fix

Validates: Requirements 1.1, 1.2

This test is designed to FAIL on unfixed code.
Failure confirms the bug exists:
  - deploy-production.yml "Health check" step has no `continue-on-error: true`
  - deploy-production.yml "Health check" script contains `exit 1`
  - deploy-staging.yml "Health check" step HAS `continue-on-error: true` (asymmetry = bug)

When the fix is applied (Task 3), this test will PASS, confirming the bug is resolved.
"""

import yaml
import pytest
from pathlib import Path

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


class TestBugConditionHealthCheck:
    """
    Bug Condition Exploration Tests — Property 1: Bug Condition

    These tests assert the EXPECTED (fixed) behavior.
    On unfixed code they FAIL, which confirms the bug exists.

    Validates: Requirements 1.1, 1.2
    """

    def test_production_health_check_has_continue_on_error(self):
        """
        Assert that deploy-production.yml "Health check" step has `continue-on-error: true`.

        BUG CONDITION: This assertion FAILS on unfixed code because the step
        does NOT have `continue-on-error: true`, meaning HTTP 403 causes the
        entire job to fail.

        Counterexample: step "Health check" in deploy-production.yml —
        absence of `continue-on-error: true` → job fails with HTTP 403.

        Validates: Requirements 1.1, 1.2
        """
        workflow = load_workflow(PRODUCTION_WORKFLOW)
        step = find_step(workflow, "Health check")

        assert step is not None, (
            "Step 'Health check' not found in deploy-production.yml"
        )

        assert step.get("continue-on-error") is True, (
            f"BUG CONFIRMED: Step 'Health check' in deploy-production.yml does NOT have "
            f"`continue-on-error: true` (found: {step.get('continue-on-error')!r}). "
            f"This means any non-200 HTTP response (including 403 from Cloudflare/Nginx) "
            f"will fail the entire deployment job and trigger an unnecessary rollback."
        )

    def test_production_health_check_script_does_not_contain_exit_1(self):
        """
        Assert that the "Health check" script in deploy-production.yml does NOT contain `exit 1`.

        BUG CONDITION: This assertion FAILS on unfixed code because the script
        explicitly calls `exit 1` when BACKEND_STATUS != "200" after 3 attempts,
        which causes the step (and job) to fail when HTTP 403 is received.

        Counterexample: script contains `exit 1` → non-zero exit code → job fails.

        Validates: Requirements 1.1, 1.2
        """
        workflow = load_workflow(PRODUCTION_WORKFLOW)
        step = find_step(workflow, "Health check")

        assert step is not None, (
            "Step 'Health check' not found in deploy-production.yml"
        )

        script = step.get("run", "")
        assert "exit 1" not in script, (
            f"BUG CONFIRMED: Step 'Health check' in deploy-production.yml contains `exit 1`. "
            f"When curl returns HTTP 403 (Cloudflare blocking GitHub Actions runner IPs), "
            f"the script executes `exit 1`, failing the job and triggering rollback "
            f"even though the backend is healthy (verified internally via SSH in the "
            f"'Deploy to production' step)."
        )

    def test_staging_health_check_has_continue_on_error(self):
        """
        Assert that deploy-staging.yml "Health check" step HAS `continue-on-error: true`.

        This confirms the asymmetry between staging and production that causes the bug:
        - staging: has `continue-on-error: true` → works correctly
        - production: missing `continue-on-error: true` → fails on HTTP 403

        This test should PASS on both unfixed and fixed code (staging is not changed).

        Validates: Requirements 1.2
        """
        workflow = load_workflow(STAGING_WORKFLOW)
        step = find_step(workflow, "Health check")

        assert step is not None, (
            "Step 'Health check' not found in deploy-staging.yml"
        )

        assert step.get("continue-on-error") is True, (
            f"Unexpected: deploy-staging.yml 'Health check' step does NOT have "
            f"`continue-on-error: true` (found: {step.get('continue-on-error')!r}). "
            f"This is the reference behavior that production should match."
        )

    def test_asymmetry_between_production_and_staging(self):
        """
        Assert that both production and staging "Health check" steps have `continue-on-error: true`.

        BUG CONDITION: This assertion FAILS on unfixed code because production
        is missing `continue-on-error: true` while staging has it — this asymmetry
        IS the bug.

        Counterexample:
          - deploy-staging.yml  → continue-on-error: true  ✅
          - deploy-production.yml → continue-on-error: (absent/false)  ❌

        Validates: Requirements 1.1, 1.2
        """
        prod_workflow = load_workflow(PRODUCTION_WORKFLOW)
        staging_workflow = load_workflow(STAGING_WORKFLOW)

        prod_step = find_step(prod_workflow, "Health check")
        staging_step = find_step(staging_workflow, "Health check")

        assert prod_step is not None, "Step 'Health check' not found in deploy-production.yml"
        assert staging_step is not None, "Step 'Health check' not found in deploy-staging.yml"

        staging_coe = staging_step.get("continue-on-error")
        prod_coe = prod_step.get("continue-on-error")

        assert staging_coe is True, (
            f"deploy-staging.yml 'Health check' should have continue-on-error: true, "
            f"got: {staging_coe!r}"
        )

        assert prod_coe is True, (
            f"BUG CONFIRMED (asymmetry): deploy-staging.yml has `continue-on-error: true` "
            f"but deploy-production.yml has `continue-on-error: {prod_coe!r}`. "
            f"This asymmetry causes production deploys to fail with HTTP 403 "
            f"(Cloudflare blocking GitHub Actions runner IPs) while staging handles "
            f"the same scenario gracefully."
        )
