#!/bin/sh

echo "Waiting for postgres at ${DB_HOST}:${POSTGRESDB_DOCKER_PORT}..."

# netcat
count=0
until nc -z "${DB_HOST}" "${POSTGRESDB_DOCKER_PORT}"; do
  sleep 1
  count=$((count + 1))
  if [ "$count" -eq 5 ]; then
    echo "Waiting for postgres at ${DB_HOST}:${POSTGRESDB_DOCKER_PORT}..."
    count=0
  fi
done

echo "Postgres is up - executing command"

exec "$@"