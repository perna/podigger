from datetime import date
from sqlalchemy import desc
from sqlalchemy.sql import func
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

    def get_top_terms(self, init_date, final_date, num_limit):
        pterm = PopularTerm
        query = db.session.query(pterm.term, func.sum(pterm.times).label('total')
                                 ).filter((pterm.date_search.between(init_date, final_date))
                                 ).group_by(pterm.term).order_by(desc('total')).limit(num_limit)

        terms = []
        for q in query:
            term = {
                'name': q[0],
                'times': q[1]
            }
            terms.append(term)

        return terms
