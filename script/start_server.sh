#!/bin/bash

original_dir="$(pwd)"
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
cd ..

# Start the server
nodejs "server.js" &

cd "$original_dir"

