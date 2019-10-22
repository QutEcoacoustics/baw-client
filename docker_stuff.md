#Notes for building and running docker image/container

## build the image

`TAG=bc`

`docker build . -t $TAG`

## run the container

run with this directory mounted so you can edit locally and have stuff updated
- note: there is no bash in alpine, so use sh
- `NODE_ENV` can be development or production.
- port 9018 is for karma and 8080 is for the client itself. 
- port 9100 is mentioned in the karma file, but I am still not sure how to use it

`docker run -ti --rm --env NODE_ENV=development --mount type=bind,src="$(pwd)",dst=/home/node/workbench-client -p 9018:9018 -p 9100:9100 -p 8080:8080 $TAG sh`

or for root user (probably not necessary)
`docker run -ti --rm --env NODE_ENV=development -u root:root --mount type=bind,src="$(pwd)",dst=/home/node/workbench-client -p 9018:9018 -p 9100:9100 -p 8080:8080 $TAG sh`

## start it

Within the container interactive mode:

`npm install`

Note, I have also built the image with `RUN npm install` to save time if starting and stopping the container a lot

`npm start`

Karma is configured not to launch a browser, to save having to work with a browser in the container. 
After the output `INFO [karma]: Karma v0.13.22 server started at http://localhost:9018/` on the host, open a browser
and navigate to `http://localhost:9018?id=12345678`
I am not sure if the id is necessary

After the output 
Note: it seems to take a long time to get past `Build webserver directory: build`