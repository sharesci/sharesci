#!/bin/bash

if [ "$EUID" -ne 0 ] ; then
	printf "Please run this script as root.\n"
	exit
fi

to_install=()
to_install+=( "doxygen" )
to_install+=( "git" )
to_install+=( "curl" )
to_install+=( "postgresql-9.5" )
to_install+=( "postgresql-contrib-9.5" )

sudo apt-get update

printf "Installing most packages: %s\n" "${to_install[@]}"
apt-get -y install ${to_install[@]}

if [[ -z "$(which nodejs)" || -z "$(which npm)" ]] ; then
	printf "Installing NodeJS\n"
	curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
	sudo apt-get update
	sudo apt-get install -y nodejs
fi

if [[ -z "$(which mongo)" ]] ; then
	printf "Installing MongoDB\n"
	sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 0C49F3730359A14518585931BC711F9BA15703C6
	echo "deb [ arch=amd64,arm64 ] http://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.4.list
	sudo apt-get update
	sudo apt-get install -y mongodb-org
fi

