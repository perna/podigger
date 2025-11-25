from django.db import migrations
from django.contrib.postgres.operations import TrigramExtension

class Migration(migrations.Migration):

    dependencies = [
        ("podcasts", "0002_add_search_index"),
    ]

    operations = [
        TrigramExtension(),
    ]
