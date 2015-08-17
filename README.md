baw-client
============

The AngularJS client for the bioacoustic workbench

[![Build Status](https://travis-ci.org/QutBioacoustics/baw-client.png)](https://travis-ci.org/QutBioacoustics/baw-client) [![Dependency Status](https://gemnasium.com/QutBioacoustics/baw-client.png)](https://gemnasium.com/QutBioacoustics/baw-client) [![Code Quality](https://d3s6mut3hikguw.cloudfront.net/github/QutBioacoustics/baw-client.png)](https://codeclimate.com/github/QutBioacoustics/baw-client) [![Code Coverage](http://img.shields.io/codeclimate/coverage/github/QutBioacoustics/baw-client.svg)](https://codeclimate.com/github/QutBioacoustics/baw-client)
---
## Install instructions

`npm` is required.

Run:

    $ npm install
    
This will execute `npm install` and `bower install` to install build and vendor dependencies respectively.

## To develop:

	$ npm start

and browse to the karma tab first `localhost:<port>` (see output for port number), then `localhost:8080` after the karma unit tests have run.

To add new build packages

    $ npm install packageName --save-dev

To add new bower packages

	$ bower install packageName --save-dev

You'll need to configure `build.config.js` when adding any new grunt packages to the vendor directory.

## To build:

	$ npm run build

and copy the artifacts from the `/bin` directory.

`npm run build` passes arguments to the `grunt` build tool.
The `grunt` runner will accept three build options that will rewrite important variables for different _environments_.

 - development: `$ grunt --development`
    - execute `$ npm run build -- --development`
 - staging: `$ grunt --staging`
     - execute `$ npm run build -- --staging`
 - production (the default): `$ grunt --production`
     - execute `$ npm run build -- --production`

These _environments_ are configured in `buildConfig/environmentSettings.json`. We recommend you keep a **private**
version of the `environmentsSettings.json` that are specific to your organization and temporarily replace this
repository's copy when you do a production build.

Additionally, the grunt command will accept a `--use-phantomjs` JS options which will switch the default `karma` test runner
from Chrome to PhantomJS.

## To make a release

You'll need write permissions to this repository to make a release.

1. Ensure your current branch is `master`
1. Ensure your working directory is clean
1. Ensure you've updated, do a `git pull`
1. Then finally run `grunt bump`
    - Where arguments are defined by https://github.com/vojtajina/grunt-bump
    - Examples
        - `grunt bump:patch`
        - `grunt bump:minor`
        - `grunt bump:major`
        - `grunt bump --setversion=1.0.0`

To bump the version, without changing anything other than the version (no changelog, not commits, no tags), run:

    $ grunt bump-only:<<argument>>

# Licence
Apache License, Version 2.0

---

Based on the [ng-boilerplate](https://github.com/ngbp/ng-boilerplate) library.
