import sendgrid


def send(subject, message):

    sg = sendgrid.SendGridClient('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')

    mail = sendgrid.Mail()
    mail.add_to()
    mail.set_subject(subject)
    mail.set_text(message)
    mail.set_from('podigger <podigger@andersonmeira.com>')
    status, msg = sg.send(mail)
    print(status, msg)


