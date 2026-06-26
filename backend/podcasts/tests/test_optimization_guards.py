"""Single test that runs every optimization regression guard.

If ANY of the optimizations regress, this test fails. It is the
maintainer's one-stop smoke test for the whole optimization pass.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[3]


@pytest.mark.django_db
def test_all_optimization_guards_pass():
    """Run the slow + fast suites for the optimization pass and assert green.

    Skips itself if pytest is not available on the path (the test is still
    useful in CI; locally a developer can run `make test` instead).
    """
    result = subprocess.run(  # noqa: S603
        [
            sys.executable,
            "-m",
            "pytest",
            "-q",
            "backend/podcasts/tests/test_refresh_service.py",
            "backend/podcasts/tests/test_search_pure_read.py",
            "backend/podcasts/tests/test_connection_reuse.py",
            "backend/podcasts/tests/test_api.py",
            "backend/podcasts/tests/test_views_features.py",
            "backend/podcasts/tests/test_updater.py",
        ],
        cwd=str(REPO_ROOT),
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, (
        "optimization regression suite failed:\n"
        f"STDOUT:\n{result.stdout}\nSTDERR:\n{result.stderr}"
    )
