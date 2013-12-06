baw-client
============

The AngularJS client for the bioacoustic workbench

![Build status](https://travis-ci.org/QutBioacoustics/baw-client.png)("QutBioacoustics/baw-client")

---
## Install instructions
	$ npm -g install grunt-cli karma bower

cd to your cloned directory and then

	$ npm install

	$ bower install

## To develop:

	$ grunt watch

and browse to the karma tab first `localhost:<port>` (see output for port number), then `localhost:8080` after the karma unit tests have run.

To add new bower packages

	$ bower install xxxx --save-dep

You'll need to configure `build.config.js` when adding any new grunt packages to the vendor directory.

## To build:

	$ grunt

and copy the artefacts from the `/bin` directory.


The `grunt` runner will accept three build options that will rewrite important variables.

 - development: `$ grunt --development`
 - staging: `$ grunt --staging`
 - production (the default): `$ grunt --production`

These variables are configured in `build.config.js`.

Additionally, the grunt command will accept a `--use-phantomjs` JS options which will switch the default `karma` test runner
from Chrome to PhantomJS.

---
# Licence
Apache License, Version 2.0

---

Based on the [ng-boilerplate](https://github.com/ngbp/ng-boilerplate) library.
