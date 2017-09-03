#!/bin/bash

SOURCE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$SOURCE_DIR/.."

# Kill any currently-running server instances
SERVER_PID="$(lsof -t -i:80 -sTCP:LISTEN)"
if [ ! -z "$SERVER_PID" ] ; then
	kill "$SERVER_PID"
fi

SERVER_PID="$(lsof -t -i:443 -sTCP:LISTEN)"
if [ ! -z "$SERVER_PID" ] ; then
	kill "$SERVER_PID"
fi

# Make sure packages are up-to-date
npm install
cd client
npm install
npm run build
nodejs copy-dist-files.js
cd ..

# Update the database if necessary
if [[ "$DO_DATABASE_SETUP" =~ ^[Yy]([Ee][Ss])?$ ]] ; then
	printf "Updating database schema...\n"
	psql -d sharesci < script/pg_db_schema_setup.sql
else
	printf "\$DO_DATABASE_SETUP was not \"yes\". Skipping database schema update.\n"
fi

# Start the server
nodejs "server.js" &

