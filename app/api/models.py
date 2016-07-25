import datetime
import json
from sqlalchemy.dialects.postgresql import JSON
from flask.ext.sqlalchemy import BaseQuery
from sqlalchemy_searchable import SearchQueryMixin
from sqlalchemy_utils.types import TSVectorType
from sqlalchemy_searchable import make_searchable
from app import db

tags = db.Table(
    'tags',
    db.Column('tag_id', db.Integer, db.ForeignKey('tag.id')),
    db.Column('episode_id', db.Integer, db.ForeignKey('episode.id'))
)


class Base(db.Model):
    __abstract__ = True

    id = db.Column(db.Integer, primary_key=True, autoincrement=True, index=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.now)
    updated_at = db.Column(db.DateTime, onupdate=datetime.datetime.now)


class Podcast(Base):
    __tablename__ = 'podcast'

    name = db.Column(db.String(128), unique=True, nullable=False, index=True)
    feed = db.Column(db.String(), unique=True, nullable=False, index=True)
    episodes = db.relationship('Episode', backref='podcast', lazy='dynamic')

    def __init__(self, name, feed):
        self.name = name
        self.feed = feed

    def __repr__(self):
        return '<id {}>'.format(self.id)


make_searchable()

class EpisodeQuery(BaseQuery, SearchQueryMixin):
    pass


class Episode(Base):
    query_class = EpisodeQuery
    __tablename__ = 'episode'

    title = db.Column(db.String(), nullable=False)
    link = db.Column(db.String(), unique=True, nullable=False, index=True)
    description = db.Column(db.Text())
    published = db.Column(db.DateTime)
    enclosure = db.Column(db.String())
    to_json = db.Column(JSON)
    podcast_id = db.Column(db.Integer, db.ForeignKey('podcast.id'))
    tags = db.relationship('Tag', secondary=tags, backref=db.backref('episodes', lazy='dynamic'))
    search_vector = db.Column(TSVectorType('title', 'description'))

    def __init__(self, title, link, description, published, enclosure, podcast_id, data_json):
        self.title = title
        self.link = link
        self.description = description
        self.published = published
        self.enclosure = enclosure
        self.podcast_id = podcast_id
        self.to_json = json.dumps(data_json)

    def __repr__(self):
        return '<id {}>'.format(self.id)


class Tag(Base):
    __tablename__ = 'tag'

    name = db.Column(db.String(), unique=True, nullable=False, index=True)

    def __init__(self, name):
        self.name = name

    def __repr__(self):
        return '<id {}>'.format(self.id)


class PopularTerm(Base):
    __tablename__ = 'popular_term'

    term = db.Column(db.String(), nullable=False, index=True)
    times = db.Column(db.Integer, default=1)
    date_search = db.Column(db.Date(), index=True,  default=datetime.datetime.today())

    def __init__(self, term, date_search):
        self.term = term
        self.date_search = date_search

    def __repr__(self):
        return '<id {}>'.format(self.id)


class TopicSuggestion(Base):
    __tablename__ = 'topic_suggestion'

    title = db.Column(db.String(), nullable=False, index=True)
    description = db.Column(db.Text())
    is_recorded = db.Column(db.Boolean(), nullable=False, default=False)

    def __init__(self, title, description):
        self.title = title
        self.description = description

    def __repr__(self):
        return '<id {}> <title {}>'.format(self.id, self.title)
