FROM node:12-alpine

ARG NODE_ENV=development
ENV NODE_ENV=$NODE_ENV \
    # https://github.com/nodejs/docker-node/blob/master/docs/BestPractices.md#global-npm-dependencies
    NPM_CONFIG_PREFIX=/home/node/.npm-global \
    PATH=$PATH:/home/node/.npm-global/bin

RUN apk --update add git less openssh && \
    rm -rf /var/lib/apt/lists/* && \
    rm /var/cache/apk/* && \
    mkdir -p /home/node/workbench-client && \
    chown node:node /home/node/workbench-client

WORKDIR /home/node/workbench-client

# install chromium
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# karma needs these so it can find the browser
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV CHROME_PATH=/usr/lib/chromium/

USER node

COPY --chown=node:node package.json package-lock.json* bower.json .bowerrc ./

# I had to add node-sass here otherwise 
RUN echo "running as $(whoami)..." && \
    npm i npm@latest -g && \
    npm install -g bower node-sass && \
    npm install --no-optional && \
    npm cache clean --force


# these may come in handy while developing
RUN npm install -g grunt-cli karma-cli

COPY --chown=node:node . .

EXPOSE 9018 9100 8080 35729

