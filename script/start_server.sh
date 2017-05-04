#!/bin/bash

SOURCE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$SOURCE_DIR/.."

SERVER_PID="$(lsof -t -i:80 -sTCP:LISTEN)"
kill "$SERVER_PID"
SERVER_PID="$(lsof -t -i:443 -sTCP:LISTEN)"
kill "$SERVER_PID"

npm install
cd clients
npm install
npm run build:nowatch
cd ..
psql -d sharesci < script/pg_db_schema_setup.sql
nodejs "server.js" &

