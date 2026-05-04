# Testing the Image Cleanup Workflow

## Manual Testing Steps

### 1. Dry Run Test (Safe - No Deletions)

**Purpose**: Verify the workflow runs correctly and identifies old images without deleting them.

**Steps**:
1. Go to GitHub Actions → Cleanup Old Images
2. Click "Run workflow"
3. Set parameters:
   - `dry_run`: `true`
   - `retention_days`: `30`
4. Click "Run workflow"
5. Wait for completion
6. Review the logs and summary

**Expected Results**:
- Workflow completes successfully
- Logs show "[DRY RUN] Would delete..." messages
- Summary shows count of images that would be deleted
- No actual deletions occur
- Protected tags (latest, main, develop) are skipped

### 2. Actual Cleanup Test (Deletes Old Images)

**Purpose**: Verify the workflow actually deletes old images.

**Prerequisites**:
- Have images older than 30 days in GHCR
- Verify they are not needed for rollback
- Run dry run first to preview

**Steps**:
1. Go to GitHub Actions → Cleanup Old Images
2. Click "Run workflow"
3. Set parameters:
   - `dry_run`: `false`
   - `retention_days`: `30`
4. Click "Run workflow"
5. Wait for completion
6. Review the logs and summary
7. Verify images were deleted in GHCR

**Expected Results**:
- Workflow completes successfully
- Logs show "Deleting version..." messages
- Summary shows count of deleted images
- Old images are removed from GHCR
- Protected tags remain untouched

### 3. Custom Retention Period Test

**Purpose**: Verify custom retention periods work correctly.

**Steps**:
1. Go to GitHub Actions → Cleanup Old Images
2. Click "Run workflow"
3. Set parameters:
   - `dry_run`: `true`
   - `retention_days`: `60` (or any custom value)
4. Click "Run workflow"
5. Review logs to verify cutoff date calculation

**Expected Results**:
- Cutoff date is calculated correctly (60 days ago)
- Only images older than 60 days are identified for deletion

### 4. Protected Tags Test

**Purpose**: Verify protected tags are never deleted.

**Steps**:
1. Ensure you have images with tags: `latest`, `main`, `develop`
2. Run workflow with `dry_run: false` and `retention_days: 0`
3. Review logs

**Expected Results**:
- Protected tags are skipped with message "Keeping protected version..."
- Protected images remain in GHCR regardless of age

### 5. Scheduled Run Test

**Purpose**: Verify the workflow runs automatically on schedule.

**Steps**:
1. Wait for Sunday at 3 AM UTC
2. Check GitHub Actions for automatic run
3. Review logs and summary

**Expected Results**:
- Workflow runs automatically
- Uses default parameters (dry_run: false, retention_days: 30)
- Completes successfully

## Validation Checklist

- [ ] Workflow file has valid YAML syntax
- [ ] Workflow appears in GitHub Actions UI
- [ ] Manual trigger works with default parameters
- [ ] Manual trigger works with custom parameters
- [ ] Dry run mode works correctly (no deletions)
- [ ] Actual deletion mode works correctly
- [ ] Protected tags are never deleted
- [ ] Custom retention periods work
- [ ] Both backend and frontend images are processed
- [ ] Summary is generated correctly
- [ ] Logs are detailed and helpful
- [ ] Scheduled run works (wait for Sunday 3 AM UTC)

## Troubleshooting Tests

### Test: Authentication Failure

**Simulate**: Remove `packages: write` permission temporarily

**Expected**: Workflow fails with authentication error

**Fix**: Restore `packages: write` permission

### Test: No Images to Delete

**Simulate**: Run with very short retention period (e.g., 1 day) when all images are recent

**Expected**: Workflow completes successfully with "0 deleted" in summary

### Test: API Rate Limiting

**Simulate**: Run multiple times in quick succession

**Expected**: May hit rate limits if too many requests

**Note**: GitHub API allows 5000 requests/hour for authenticated requests

## Integration Testing

### Test with CI Pipeline

1. Push a commit to trigger CI
2. Wait for CI to build and push images
3. Manually run cleanup workflow with `retention_days: 0` and `dry_run: true`
4. Verify new images are identified but protected by tags

### Test with Deployment

1. Deploy to staging
2. Wait 31 days (or modify retention period)
3. Deploy again with new images
4. Run cleanup workflow
5. Verify old staging images are deleted
6. Verify current staging images are kept

## Performance Testing

### Test: Large Number of Images

**Scenario**: Repository with 100+ image versions

**Steps**:
1. Run cleanup workflow
2. Monitor execution time
3. Check for pagination issues

**Expected**: 
- Workflow handles pagination correctly
- Completes within reasonable time (< 10 minutes)
- All pages of images are processed

## Security Testing

### Test: Permission Validation

**Verify**:
- Workflow uses `GITHUB_TOKEN` (not hardcoded credentials)
- Token has minimal required permissions
- No secrets are logged in output

### Test: Protected Tag Bypass Attempt

**Scenario**: Try to delete protected tags

**Expected**: Protected tags are always skipped, regardless of age

## Monitoring

### Metrics to Track

After running the workflow, track:
- Number of images deleted
- Number of images kept
- Execution time
- Storage space saved
- Errors or failures

### Success Criteria

- Workflow completes without errors
- Old images are deleted correctly
- Protected tags are preserved
- Storage space is reduced
- No impact on deployments

## Rollback Testing

### Test: Rollback After Cleanup

**Scenario**: Verify rollback still works after cleanup

**Steps**:
1. Note current deployment image tag
2. Run cleanup workflow (delete old images)
3. Attempt to rollback to a recent version (within retention period)
4. Verify rollback succeeds

**Expected**: Rollback works because recent images are kept

### Test: Rollback to Deleted Image

**Scenario**: Verify appropriate error when trying to rollback to deleted image

**Steps**:
1. Run cleanup workflow (delete old images)
2. Attempt to rollback to a very old version (beyond retention period)
3. Verify appropriate error message

**Expected**: Rollback fails with clear error about missing image

## Documentation Testing

### Verify Documentation

- [ ] README-cleanup.md is accurate
- [ ] DEPLOYMENT_STRATEGY.md includes cleanup workflow
- [ ] Examples in documentation work correctly
- [ ] Troubleshooting guide is helpful

## Conclusion

After completing all tests, the cleanup workflow should:
- Run reliably on schedule
- Delete old images correctly
- Preserve protected tags
- Provide clear logs and summaries
- Integrate seamlessly with CI/CD pipeline
- Save storage space without impacting deployments
