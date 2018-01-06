FROM node:9.3.0

WORKDIR /usr/src/bodhi/bodhi-graphql

COPY package.json ./

RUN npm install

COPY src .

COPY wait-for-it.sh wait-for-it.sh
