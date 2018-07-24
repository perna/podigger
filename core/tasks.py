from celery import shared_task

@shared_task
def hello_task():
    return 'hello rabbitmq'
