FROM node:16.18-alpine as build
WORKDIR /usr/app

COPY package*.json ./

RUN npm install --silent

COPY . /usr/app

RUN npx prisma generate
RUN npm run build

EXPOSE 80

CMD npx prisma migrate deploy && npm run start
