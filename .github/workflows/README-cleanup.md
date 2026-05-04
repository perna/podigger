# Image Cleanup Workflow

## Overview

This workflow automatically cleans up old Docker images from GitHub Container Registry (GHCR) to save storage space and maintain a clean registry.

## Features

- **Automated Cleanup**: Runs weekly on Sundays at 3 AM UTC
- **Configurable Retention**: Default 30 days, customizable via manual trigger
- **Protected Tags**: Never deletes `latest`, `main`, or `develop` tags
- **Dry Run Support**: Preview deletions before actually deleting
- **Multi-Service**: Cleans up both backend and frontend images

## Schedule

The workflow runs automatically:
- **Weekly**: Every Sunday at 3:00 AM UTC
- **Manual**: Can be triggered manually via GitHub Actions UI

## Manual Execution

### Steps

1. Go to **Actions** tab in GitHub
2. Select **Cleanup Old Images** workflow
3. Click **Run workflow** button
4. Configure parameters:
   - **Dry run**: 
     - `true` (default) - Preview what would be deleted without actually deleting
     - `false` - Actually delete old images
   - **Retention days**: Number of days to keep images (default: 30)
5. Click **Run workflow** to start

### Example Use Cases

#### Preview Cleanup (Dry Run)
```
dry_run: true
retention_days: 30
```
This will show what images would be deleted without actually deleting them.

#### Delete Images Older Than 30 Days
```
dry_run: false
retention_days: 30
```
This will delete all images older than 30 days (except protected tags).

#### Delete Images Older Than 60 Days
```
dry_run: false
retention_days: 60
```
This will delete all images older than 60 days (except protected tags).

## Protected Tags

The following tags are **never deleted**, regardless of age:
- `latest` - Latest stable release
- `main` - Main branch images
- `develop` - Development branch images

## How It Works

1. **Authentication**: Logs into GHCR using `GITHUB_TOKEN`
2. **Fetch Versions**: Retrieves all image versions via GitHub API
3. **Filter by Date**: Identifies images older than retention period
4. **Skip Protected**: Skips images with protected tags
5. **Delete**: Removes old images (or previews in dry run mode)
6. **Report**: Generates summary of deleted/kept images

## Requirements

### Permissions

The workflow requires the following permissions:
- `contents: read` - Read repository contents
- `packages: write` - Delete package versions

These are automatically provided by the `GITHUB_TOKEN`.

### GitHub Container Registry

Images must be stored in GitHub Container Registry with the naming convention:
```
ghcr.io/{owner}/{repo}/backend:sha-{commit_sha}
ghcr.io/{owner}/{repo}/frontend:sha-{commit_sha}
```

## Configuration

### Modify Schedule

Edit `.github/workflows/cleanup-images.yml`:

```yaml
on:
  schedule:
    - cron: '0 3 * * 0'  # Sunday at 3 AM UTC
```

Cron format: `minute hour day-of-month month day-of-week`

Examples:
- `0 3 * * 0` - Every Sunday at 3 AM
- `0 2 * * 1` - Every Monday at 2 AM
- `0 0 1 * *` - First day of every month at midnight

### Modify Default Retention

Edit the `retention_days` default value:

```yaml
workflow_dispatch:
  inputs:
    retention_days:
      default: 30  # Change this value
```

### Add More Protected Tags

Edit the script section to add more protected tags:

```bash
if echo "${TAGS}" | grep -qE '(^|,)(latest|main|develop|v[0-9]+)(,|$)'; then
  # Add your tags to the regex pattern above
```

## Monitoring

### GitHub Actions Summary

After each run, the workflow generates a summary showing:
- Service name (backend/frontend)
- Retention period
- Cutoff date
- Dry run status
- Number of images deleted/kept

### Logs

Detailed logs include:
- Each image version processed
- Creation date and tags
- Whether it was deleted or kept
- Reason for keeping (protected tag or recent)

## Troubleshooting

### Authentication Errors

**Problem**: `401 Unauthorized` or `403 Forbidden`

**Solution**: 
- Ensure `packages: write` permission is set in workflow
- Verify `GITHUB_TOKEN` has access to the repository

### No Images Deleted

**Problem**: Workflow runs but no images are deleted

**Possible Causes**:
1. All images are newer than retention period
2. All images have protected tags
3. Dry run mode is enabled

**Solution**: Check the workflow logs to see why images were kept

### API Rate Limiting

**Problem**: `429 Too Many Requests`

**Solution**: 
- GitHub API has rate limits (5000 requests/hour for authenticated requests)
- If you have many images, consider increasing retention period
- Run cleanup less frequently

## Best Practices

1. **Test with Dry Run First**: Always run with `dry_run: true` first to preview deletions
2. **Monitor Storage**: Check GHCR storage usage regularly
3. **Adjust Retention**: Increase retention period if you need to rollback to older versions
4. **Review Protected Tags**: Ensure important tags are protected
5. **Schedule Wisely**: Run during low-traffic periods (e.g., weekends)

## Related Documentation

- [GitHub Container Registry Documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [GitHub API - Packages](https://docs.github.com/en/rest/packages)

## Support

For issues or questions:
1. Check workflow logs in GitHub Actions
2. Review this documentation
3. Contact DevOps team
