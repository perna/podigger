from datetime import date
from app.api.models import PopularTerm, db


class TermRepository:

    def create_or_update(self, term):

        query = PopularTerm.query.filter_by(term=term, date_search=date.today()).first()

        if query is not None:
            query.times += 1
            db.session.commit()
        else:
            new_term = PopularTerm(term=term, date_search=date.today())
            db.session.add(new_term)
            db.session.commit()

