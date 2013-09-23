baw-client
==========

The AngularJS client for the bioacoustic workbench


## Install instructions
	$ npm -g install grunt-cli karma bower

cd to your cloned directory and then

	$ npm install

	$ bower install

To add new bower packages

	$ bower install xxxx --save-dep

You'll also have to configure `build.config.js` when adding any new packages to vendor directory.
	

## To develop:

	$ grunt watch

and browse to `localhost:8080`

## To build:

	$ grunt compile

and copy the artefacts from the `/bin` directory.


Based off the [ng-boilerplate](https://github.com/ngbp/ng-boilerplate) library.