import twitter
import requests
import json

api = twitter.Api(
        consumer_key='BBY1WBMAxH1Db37Ac4emyE8SC',
        consumer_secret='QSUt7dFLpacrwhh99R2iMm7Ofjm1Wai9x41dc6LZjWQ2VAcF7o',
        access_token_key='744276322550169600-vsaSUIH28dhGbLeuY1T5lUX7asmhYTa',
        access_token_secret='L7fySzoND0TQ3hzpxkeaEYB2nVAs1bFfy50at3byLJlzZ',
      )

class TwitterNotifier:

  def __init__(self):
    self.api = api


  def short_url(self, url):
    header = {'Content-type': 'application/json'}
    if(isinstance(url, list)):
        data = {"url": url[0]}
    else:
        data = {"url": url}

    return requests.post('https://perna.in/api/links', data=json.dumps(data), headers=header).json()

  def send_tweet(self, podcast_name, url):
    new_url = self.short_url(url)
    message = 'Novo podcast encontrado: "{}" - {} #podcast'.format(podcast_name, new_url['short_url'])
    status = api.PostUpdate(message)
    print(status.text)
