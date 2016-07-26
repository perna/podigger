from flask_wtf import Form
from wtforms import StringField, TextAreaField
from wtforms.validators import DataRequired, Length, URL
from wtforms.widgets import TextArea

class SearchForm(Form):
    term = StringField('Termo', validators=[DataRequired(), Length(min=3)])


class PodcastForm(Form):
    name = StringField('Nome', validators=[DataRequired()])
    feed = StringField('Feed', validators=[DataRequired(), URL()])


class PodcastSearchForm(Form):
    term = StringField('Termo', validators=[DataRequired()])


class TopicSuggestionForm(Form):
    title = StringField('Título', validators=[DataRequired(message="campo obrigatório")])
    description = TextAreaField('Descrição', widget=TextArea(), validators=[DataRequired()])


