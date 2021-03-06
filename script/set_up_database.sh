#!/bin/bash

original_dir="$(pwd)"

SOURCE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SOURCE_DIR/.."

sudo service mongod start
sudo service postgresql start

mongo sharesci --eval 'db.papers.createIndex({"$**": "text"});'

sudo su -c 'psql <<< "
	CREATE USER sharesci WITH LOGIN PASSWORD '\''sharesci'\'';
	CREATE DATABASE sharesci;
	GRANT ALL PRIVILEGES ON DATABASE sharesci TO sharesci;
	\c sharesci;
	CREATE EXTENSION CITEXT;"
' postgres

# TODO: This is insecure and should be updated to use a .pgpass file
sudo PGPASSWORD='sharesci' psql -U sharesci -h localhost -d sharesci < script/pg_db_schema_setup.sql

cd "$original_dir"

