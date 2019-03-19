FROM python:3.7-stretch

ENV PYTHONUNBUFFERED 1
ENV PYTHONPATH="$PYTHONPATH:/code"

WORKDIR /code
COPY requirements.txt ./

RUN pip install --upgrade pip
RUN pip install -r requirements.txt
