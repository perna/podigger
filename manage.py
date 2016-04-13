import os
from flask.ext.script import Manager
from flask.ext.migrate import Migrate, MigrateCommand
from config.config import DevConfiguration
from app import app, db
from app.api.models import Podcast

app.config.from_object(DevConfiguration)

migrate = Migrate(app, db)
manager = Manager(app)

manager.add_command('db', MigrateCommand)

if __name__ == '__main__':
    manager.run()