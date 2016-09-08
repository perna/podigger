from jinja2 import Markup

class Momentjs:

    def __init__(self, timestamp):
        self.timestamp = timestamp

    def render(self, format):
        return Markup("<script>\ndocument.write(moment(\"%s\").%s);\n</script>" % (
                        self.timestamp.strftime( "%Y-%m-%dT%H:%M:%S" ), format))

    def from_now(self):
        return self.render("fromNow()")