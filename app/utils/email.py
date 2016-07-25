from app import app
import sendgrid


class SendMail():
    def __init__(self):
        self.sg = sendgrid.SendGridClient(app.config['SENDGRID_API_KEY'])
        self.mail = sendgrid.Mail()
        self.mail.add_to(app.config['SENDGRID_EMAIL_ADMIN'])

    def send(self, subject, message):

        self.mail.set_subject(subject)
        self.mail.set_text(message)
        self.mail.set_from('podigger <podigger@andersonmeira.com>')
        status, msg = self.sg.send(self.mail)
        print(status, msg)