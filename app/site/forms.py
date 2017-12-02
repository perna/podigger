from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, SelectField
from wtforms.validators import DataRequired, Length, URL
from wtforms.widgets import TextArea
#from app.api.models import PodcastLanguage

class SearchForm(FlaskForm):
    term = StringField('Termo', validators=[DataRequired(), Length(min=3)])


class PodcastForm(FlaskForm):
    name = StringField('Nome', validators=[DataRequired()])
    feed = StringField('Feed', validators=[DataRequired(), URL()])


class PodcastSearchForm(FlaskForm):
    term = StringField('Termo', validators=[DataRequired()])


class TopicSuggestionForm(FlaskForm):
    title = StringField('Título', validators=[DataRequired(message="campo obrigatório")])
    description = TextAreaField('Descrição', widget=TextArea(), validators=[DataRequired()])


