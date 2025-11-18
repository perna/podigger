from django.db import migrations


class Migration(migrations.Migration):

    initial = True

    dependencies = []

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
