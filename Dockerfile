FROM pypy:3-6

ENV PYTHONUNBUFFERED 1
ENV PYTHONPATH="$PYTHONPATH:/code"

WORKDIR /code
COPY requirements.txt ./
RUN pip install -r requirements.txt
