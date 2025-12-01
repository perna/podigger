from django.db import migrations


class Migration(migrations.Migration):

    # Create the GIN expression index for full-text search using Portuguese
    # configuration. This runs `CREATE INDEX CONCURRENTLY` and therefore must
    # be non-atomic.
    atomic = False

    dependencies = [
        ("podcasts", "0002_enable_pg_trgm"),
    ]

    operations = [
        migrations.RunSQL(
            sql=(
                "CREATE INDEX CONCURRENTLY IF NOT EXISTS podcasts_episode_search_gin "
                "ON podcasts_episode USING GIN (to_tsvector('portuguese', coalesce(title,'') || ' ' || coalesce(description,'')));"
            ),
            reverse_sql=(
                "DROP INDEX CONCURRENTLY IF EXISTS podcasts_episode_search_gin;"
            ),
        ),
    ]
