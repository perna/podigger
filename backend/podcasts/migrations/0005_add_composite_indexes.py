"""Add the composite indexes for the PostgreSQL database optimization pass.

Both indexes are created with `CREATE INDEX CONCURRENTLY IF NOT EXISTS`
so the migration is safe to apply against a populated database without
taking a long-running write lock. The migration is therefore non-atomic
(the same pattern as `0003_add_search_index.py`).
"""
from django.db import migrations


class Migration(migrations.Migration):
    atomic = False  # required for CREATE INDEX CONCURRENTLY

    dependencies = [
        ("podcasts", "0004_alter_popularterm_date_search"),
    ]

    operations = [
        migrations.RunSQL(
            sql=(
                "CREATE INDEX CONCURRENTLY IF NOT EXISTS "
                "podcasts_episode_podcast_published_idx "
                "ON podcasts_episode (podcast_id, published DESC);"
            ),
            reverse_sql=(
                "DROP INDEX CONCURRENTLY IF EXISTS "
                "podcasts_episode_podcast_published_idx;"
            ),
        ),
        migrations.RunSQL(
            sql=(
                "CREATE INDEX CONCURRENTLY IF NOT EXISTS "
                "podcasts_popularterm_term_idx "
                "ON podcasts_popularterm (term);"
            ),
            reverse_sql=(
                "DROP INDEX CONCURRENTLY IF EXISTS "
                "podcasts_popularterm_term_idx;"
            ),
        ),
    ]
