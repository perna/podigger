from flask import Flask
from flask_orator import Orator
from config.config import DevConfiguration

app = Flask(__name__)

app.config.from_object(DevConfiguration)

db = Orator(app)

import podigger.views