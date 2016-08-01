from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
from app import app, db
from app.api.models import Podcast, Episode, TopicSuggestion, PopularTerm, Tag


class PodcastView(ModelView):
    column_searchable_list = ['name']
    column_editable_list = ['name', 'feed']
    column_list = ('name', 'feed', 'created_at', 'updated_at')

admin = Admin(app, name='Podigger', template_mode='bootstrap3')

class EpisodeView(ModelView):
    column_searchable_list = ['title']
    column_exclude_list = ['to_json', 'search_vetor']
    column_list = ('title', 'description', 'enclosure')


admin.add_view(PodcastView(Podcast, db.session))
admin.add_view(EpisodeView(Episode, db.session))
admin.add_view(ModelView(TopicSuggestion, db.session))
admin.add_view(ModelView(PopularTerm, db.session))
admin.add_view(ModelView(Tag, db.session))