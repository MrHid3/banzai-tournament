#!/bin/sh

echo "Waiting for postgres at ${DB_HOST}:${POSTGRESDB_DOCKER_PORT}..."

# netcat
count=0
until nc -z "${DB_HOST}" "${POSTGRESDB_DOCKER_PORT}"; do
  sleep 2
  echo "Waiting for postgres at ${DB_HOST}:${POSTGRESDB_DOCKER_PORT}..."
done
sleep 2
echo "Postgres is up - executing command"

exec "$@"