#start docker container
start:
	docker-compose up -d

#stop docker container
stop:
	docker-compose stop

#docker logs
logs:
	docker-compose logs

#start celery
start-celery:
	docker-compose run --rm web celery -A podigger worker -l info -E

#start flower
start-flower:
	docker-compose run --rm web celery flower -A podigger --broker=amqp://guest:guest@redis:6379//

#django makemigrations
makemigrations:
	docker-compose run --rm web pypy3 manage.py makemigrations

#django migrate
migrate:
	docker-compose run --rm web pypy3 manage.py migrate


#psql
psql:
	docker exec -it podigger_db_1 psql -U docker
