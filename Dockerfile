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


# temp while developing, to tweak things without npm installing every time
# ENV NODE_ENV=development
# RUN npm install

COPY . .

EXPOSE 9018 9100 8080

## Installs latest Chromium package, in case we want the karma browser to run in the container
#RUN echo @edge http://nl.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories \
#    && echo @edge http://nl.alpinelinux.org/alpine/edge/main >> /etc/apk/repositories \
#    && apk add --no-cache \
#    chromium@edge \
#    harfbuzz@edge \
#    nss@edge \
#    freetype@edge \
#    ttf-freefont@edge \
#    && rm -rf /var/cache/* \
#    && mkdir /var/cache/apk
#
## make node chrome's user, so it can run chrome
#RUN mkdir -p /usr/src/app \
#    && chown -R node:node /usr/src/app
#
#ENV CHROME_BIN=/usr/bin/chromium-browser \
#    CHROME_PATH=/usr/lib/chromium/
#
### end chrome stuff