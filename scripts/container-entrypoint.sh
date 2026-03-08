#!/bin/sh

set -eu

# Fly release machines pass a command (e.g. prisma migrate deploy). Run it and exit.
if [ "$#" -gt 0 ]; then
  exec "$@"
fi

exec npm run start
