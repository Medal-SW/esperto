#!/bin/sh
set -e

echo "Running migrations..."
alembic upgrade head

echo "Running seed..."
python -m app.seed

exec "$@"
