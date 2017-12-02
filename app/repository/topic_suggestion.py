from app.api.models import TopicSuggestion, db


class TopicSuggestionRepository:

    def create(self, title, description):
        topic = TopicSuggestion(title, description)
        db.session.add(topic)
        db.session.commit()

    def list_topics(self):
        result = TopicSuggestion.query.all()
        return result
