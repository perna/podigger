#from gevent.wsgi import WSGIServer
from app import app

if __name__ == '__main__':
    #http_server = WSGIServer(('', 9100), app)
    #http_server.serve_forever()
    app.jinja_env.cache = {}
    app.run()
