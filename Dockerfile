FROM node:10-alpine

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV \
    # https://github.com/nodejs/docker-node/blob/master/docs/BestPractices.md#global-npm-dependencies
    NPM_CONFIG_PREFIX=/home/node/.npm-global \
    PATH=$PATH:/home/node/.npm-global/bin

RUN apk --update add git less openssh && \
    rm -rf /var/lib/apt/lists/* && \
    rm /var/cache/apk/* && \
    mkdir -p /home/node/workbench-client && \
    chown node:node /home/node/workbench-client



USER node

WORKDIR /home/node/workbench-client
COPY package.json package-lock.json* ./
RUN npm i npm@latest -g && \
    npm install -g bower && \
    npm install --no-optional && \
    npm cache clean --force

COPY . .

