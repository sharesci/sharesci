#!/bin/bash

QUICK_START="$1"
original_dir="$(pwd)"
SOURCE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SOURCE_DIR/.."

if [[ "$QUICK_START" != "--quick" ]] ; then
	sudo service mongod start
	sudo service postgresql start
fi

# Kill any currently-running server instances
SERVER_PID="$(lsof -t -i:80 -sTCP:LISTEN)"
if [ ! -z "$SERVER_PID" ] ; then
	kill "$SERVER_PID"
fi

SERVER_PID="$(lsof -t -i:443 -sTCP:LISTEN)"
if [ ! -z "$SERVER_PID" ] ; then
	kill "$SERVER_PID"
fi

if [[ "$QUICK_START" != "--quick" ]] ; then
	# Make sure packages are up-to-date
	npm install
	cd client
	npm install
	npm run build
	cd ..
fi

# Start the server
nodejs "server.js" &

cd "$original_dir"

