# Implementation Plan

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Accounts Module Missing from Container
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For this deterministic bug, scope the property to the concrete failing case: Docker build without accounts COPY instruction
  - Test that the Docker build with current Dockerfile.production results in a container WITHOUT the `/app/accounts` directory
  - Test that attempting to start Gunicorn with the unfixed image crashes with `ModuleNotFoundError: No module named 'accounts'`
  - The test assertions should match the Expected Behavior Properties from design: accounts directory must be present and Django must start successfully
  - Run test on UNFIXED code (current Dockerfile.production)
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found:
    - `/app/accounts` directory is absent in container filesystem
    - Gunicorn crashes during startup with ModuleNotFoundError
    - Container healthcheck fails
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing Module Directories Preserved
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy aspects:
    - `/app/config` directory is present and contains expected files
    - `/app/podcasts` directory is present and contains expected files
    - `manage.py`, `pyproject.toml`, `pytest.ini` are present in `/app`
    - `collectstatic` command executes without errors (with `|| true`)
    - Environment variables are set correctly (PYTHONDONTWRITEBYTECODE, PYTHONUNBUFFERED, DJANGO_SETTINGS_MODULE)
  - Write tests capturing observed behavior patterns from Preservation Requirements:
    - Test that `/app/config` directory exists and has correct ownership (app:app)
    - Test that `/app/podcasts` directory exists and has correct ownership (app:app)
    - Test that root files (manage.py, pyproject.toml, pytest.ini) exist and have correct ownership
    - Test that environment variables remain unchanged
    - Test that Gunicorn command configuration remains unchanged (workers, timeout, bind)
  - Run tests on UNFIXED code (but manually copy accounts to allow container to start for comparison)
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3. Fix for missing accounts module in Docker image

  - [ ] 3.1 Implement the fix in Dockerfile.production
    - Add COPY instruction for accounts directory after the podcasts COPY line
    - Insert: `COPY --chown=app:app accounts ./accounts`
    - Position: After line 40 (`COPY --chown=app:app podcasts ./podcasts`)
    - Maintain same format and ownership pattern as existing COPY instructions
    - Do NOT modify any other lines in the Dockerfile
    - _Bug_Condition: isBugCondition(dockerBuild) where dockerBuild.dockerfile == "Dockerfile.production" AND "accounts" NOT IN dockerBuild.copiedDirectories_
    - _Expected_Behavior: dockerBuild.copiedDirectories SHALL include "accounts" AND dockerBuild.startupAttempt == SUCCESS AND NO ModuleNotFoundError_
    - _Preservation: All existing COPY instructions (config, podcasts, manage.py, pyproject.toml, pytest.ini) remain unchanged; ENV, USER, HEALTHCHECK, CMD remain unchanged_
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Accounts Module Present in Container
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify that `/app/accounts` directory now exists in container
    - Verify that Gunicorn starts successfully without ModuleNotFoundError
    - Verify that container healthcheck passes
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing Module Directories Still Present
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix:
      - `/app/config` directory still present with correct ownership
      - `/app/podcasts` directory still present with correct ownership
      - Root files still present with correct ownership
      - Environment variables unchanged
      - Gunicorn configuration unchanged
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 4. Rebuild Docker image and deploy to staging

  - [ ] 4.1 Rebuild production Docker image
    - Navigate to backend directory
    - Run: `docker build -f Dockerfile.production -t backend-fixed:latest .`
    - Verify build completes without errors
    - Verify build logs show accounts directory being copied

  - [ ] 4.2 Tag and push image to container registry
    - Tag image with appropriate version/tag for staging
    - Push to container registry used by staging environment
    - Verify image is available in registry

  - [ ] 4.3 Deploy to staging environment
    - Update staging deployment to use new image
    - Trigger deployment (method depends on infrastructure: kubectl, docker-compose, etc.)
    - Monitor deployment progress

  - [ ] 4.4 Verify staging deployment health
    - Wait for container to start (check deployment status)
    - Verify healthcheck endpoint returns 200 OK: `curl https://staging-url/health/`
    - Verify no ModuleNotFoundError in container logs
    - Verify Django admin loads correctly: `curl https://staging-url/admin/`
    - Verify application responds to requests normally
    - Monitor for any errors in logs for 5-10 minutes

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise
  - Confirm staging environment is stable and serving requests
  - Confirm no errors in logs related to missing modules
  - Document the fix and deployment in appropriate channels
