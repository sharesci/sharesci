#!/bin/bash

SOURCE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$SOURCE_DIR/.."

SERVER_PID="$(lsof -t -i:80 -sTCP:LISTEN)"
kill "$SERVER_PID"
SERVER_PID="$(lsof -t -i:443 -sTCP:LISTEN)"
kill "$SERVER_PID"

npm install
cd client
npm install
npm run build:aot
nodejs copy-dist-files.js
cd ..

if [ ! -z "NO_DATABASE_SETUP" ] ; then
	printf "Updating database schema...\n"
	psql -d sharesci < script/pg_db_schema_setup.sql
else
	printf "Found \$NO_DATABASE_SETUP. Skipping database schema update.\n"
fi
nodejs "server.js" &

