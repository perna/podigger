import datetime
from app import db


tags = db.Table(
    'tags',
    db.Column('tag_id', db.Integer, db.ForeignKey('tag.id')),
    db.Column('episode_id', db.Integer, db.ForeignKey('episode.id'))
)


class Podcast(db.Model):
    __tablename__ = 'podcast'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), unique=True, nullable=False, index=True)
    feed = db.Column(db.String(), unique=True, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.now)
    updated_at = db.Column(db.DateTime, onupdate=datetime.datetime.now)

    def __init__(self, name, feed):
        self.name = name
        self.feed = feed


    def __repr__(self):
        return '<id {}>'.format(self.id)


class Episode(db.Model):
    __tablename__ = 'episode'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(), nullable=False)
    link = db.Column(db.String(), unique=True, nullable=False)
    description = db.Column(db.Text())
    published = db.Column(db.DateTime)
    enclosure = db.Column(db.String())
    created_at = db.Column(db.DateTime, default=datetime.datetime.now)
    updated_at = db.Column(db.DateTime, onupdate=datetime.datetime.now)
    podcast_id = db.Column(db.Integer, db.ForeignKey('podcast.id'))
    tags = db.relationship('Tag', secondary=tags, backref=db.backref('podcasts', lazy='dynamic'))


    def __init__(self, title, link, description, published, enclosure, podcast_id ):
        self.tile = title
        self.link = link
        self.description = description
        self.published = published
        self.enclosure = enclosure
        self.podcast_id = podcast_id

    def __repr__(self):
        return '<id {}>'.format(self.id)


class Tag(db.Model):
    __tablename__ = 'tag'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(), unique=True, nullable=False, index=True)