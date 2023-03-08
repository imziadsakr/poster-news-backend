FROM node:14
WORKDIR /usr/src/app

ARG PROJECT_ENV

RUN echo $PROJECT_ENV  > .env
RUN echo $PROJECT_ENV  > .env

COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8080
CMD [ "npm", "run", "run:stag" ]

# RUN apt-get update && apt-get install -y cron certbot
# CMD certbot certonly --webroot --agree-tos --email malikzulqurnain2121@gmail.com -d poc.here.news -w public --keep-until-expiring --no-eff-email --test-cert && npm run run:stag