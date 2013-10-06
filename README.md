baw-client
==========

The AngularJS client for the bioacoustic workbench


## Install instructions
	$ npm -g install grunt-cli karma bower

cd to your cloned directory and then

	$ npm install

	$ bower install

## To develop:

	$ grunt watch

and browse to the karma tab first `localhost:<port>` (see output for port number), then `localhost:8080`.

To add new bower packages

	$ bower install xxxx --save-dep

You'll need to configure `build.config.js` when adding any new grunt packages to the vendor directory.

## To build:

	$ grunt compile

and copy the artefacts from the `/bin` directory.


Based off the [ng-boilerplate](https://github.com/ngbp/ng-boilerplate) library.