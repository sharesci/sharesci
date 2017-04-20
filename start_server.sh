#!/bin/bash

SOURCE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$SOURCE_DIR"

SERVER_PID="$(lsof -t -i:7080 -sTCP:LISTEN)"
kill "$SERVER_PID"

npm install
nodejs "server.js" &
