import requests

def send(subject, message):
    url = 'https://api.mailgun.net/v3/sandbox587fcabe3b1f419d9903321f3c1f1432.mailgun.org/messages'
    auth = ("api","key-30cc384ec4bb6fb703f4ff2cf2d86c3f")
    data = {
              "from": "Podigger <mailgun@sandbox587fcabe3b1f419d9903321f3c1f1432.mailgun.org>",
              "to": ["anderson.meira@gmail.com", "tati.meira@gmail.com"],
              "subject": subject,
              "text": message
            }

    return requests.post(url, auth=auth, data=data)


