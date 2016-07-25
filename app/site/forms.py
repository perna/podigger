from flask_wtf import Form
from wtforms import StringField
from wtforms.validators import DataRequired, Length, URL


class SearchForm(Form):
    term = StringField('Termo', validators=[DataRequired(), Length(min=3)])


class PodcastForm(Form):
    name = StringField('Nome', validators=[DataRequired()])
    feed = StringField('Feed', validators=[DataRequired(), URL()])


class PodcastSearchForm(Form):
    term = StringField('Termo', validators=[DataRequired()])


