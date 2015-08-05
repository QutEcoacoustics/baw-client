baw-client
============

The AngularJS client for the bioacoustic workbench

[![Build Status](https://travis-ci.org/QutBioacoustics/baw-client.png)](https://travis-ci.org/QutBioacoustics/baw-client) [![Dependency Status](https://gemnasium.com/QutBioacoustics/baw-client.png)](https://gemnasium.com/QutBioacoustics/baw-client) [![Code Quality](https://d3s6mut3hikguw.cloudfront.net/github/QutBioacoustics/baw-client.png)](https://codeclimate.com/github/QutBioacoustics/baw-client) [![Code Coverage](http://img.shields.io/codeclimate/coverage/github/QutBioacoustics/baw-client.svg)](https://codeclimate.com/github/QutBioacoustics/baw-client)
---
## Install instructions

`npm` is required.

Run:

    $ npm run setup
    
This will execute `npm install` and `bower install` to install build and vendor dependencies respectively.

## To develop:

	$ npm run watch

and browse to the karma tab first `localhost:<port>` (see output for port number), then `localhost:8080` after the karma unit tests have run.

To add new bower packages

	$ bower install xxxx --save-dep

You'll need to configure `build.config.js` when adding any new grunt packages to the vendor directory.

## To build:

	$ npm run build

and copy the artifacts from the `/bin` directory.


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
