"use strict";

;
(function (undefined) {
    var app = angular.module('bawApp.controllers');

    app.controller('ExperimentsCtrl', ['$scope', '$resource', '$routeParams', '$route', '$http', 'Media', 'AudioEvent', 'Tag',

        /**
         * The Experiments controller.
         * @param $scope
         * @param $resource
         * @param $routeParams
         * @param AudioEvent
         * @constructor
         * @param Tag
         * @param Media
         * @param $route
         * @param $http
         */
            function ExperimentsCtrl($scope, $resource, $routeParams, $route, $http, Media, AudioEvent, Tag) {

            $scope.PREFACE_STAGE = "Welcome";
            $scope.EXPERIMENT_STAGE = "Activity";
            $scope.FINAL_STAGE = "Conclusion";

            $scope.results = {
                allowContact: true,
                consented: false,
                ethicsStatementViewed: false,
                pageHit: (new Date()).toISOString()
            };
            $scope.errors = [];
            $scope.spec = {
                experimentSteps: []
            };
            $scope.stage = $scope.PREFACE_STAGE;
            $scope.step = 0;
            $scope.resultsSending = false;
            $scope.resultsSentSuccessfully = undefined;


            // download experiment protocol
            var experiment = $routeParams.experiment == "tour" ? '/experiment_assets/bird_tour.json' : '/experiment_assets/rapid_scan.json';
            experiment += "?antiCache=" + Date.now().toString();
            $http.get(experiment).
                success(function (data, status, headers, config) {
                    $scope.spec = data;
                    $scope.results.experiment = $scope.spec.experiment;

                    if ($routeParams.cheat) {
                        $scope.stage = $routeParams.cheat;
                        if ($scope.stage == $scope.EXPERIMENT_STAGE) {
                            $scope.step = 1;
                        }
                    }

                    if ($scope.spec.additionalResources) {
                        downloadOtherResources();
                    }

                }).error(function (data, status, headers, config) {
                    alert("downloading test specification failed");
                });

            function downloadOtherResources() {
                var maxAttempts = 5;

                function downloadRecursive(attemptsLeft, resource, storeProperty) {
                    if (attemptsLeft > 0) {
                        $http.get(resource + "?antiCache=" + Date.now().toString())
                            .success(function (data, status, headers, config) {
                                $scope.spec.additionalResources[storeProperty] = data;

                                console.info("Downloading resource " + resource + " succeeded.", data);
                            })
                            .error(function (data, status, headers, config) {
                                console.error("Downloading resource " + resource + " failed. Attempt " + (maxAttempts - attemptsLeft) + " of " + maxAttempts);

                                downloadRecursive(attemptsLeft--, resource, storeProperty);
                            });
                    }
                    else {
                        console.error("Downloading resource " + resource + " failed after " + maxAttempts + "attempts");
                    }
                }

                angular.forEach($scope.spec.additionalResources, function (value, key) {
                    downloadRecursive(maxAttempts, value, key);
                });
            }

            $scope.popupEthics = function ($event) {
                $event.preventDefault();

                $scope.results.ethicsStatementViewed = true;

                baw.popUpWindow("/ParticipantInformation.html", 1000, 800);
            };

            $scope.login = function () {
                $scope.$emit('event:auth-loginRequired');
            };

            $scope.isChrome = function () {
                return Boolean(window.chrome);
            };

            $scope.verifyPreface = function verifyPreface() {
                $scope.errors.length = 0;

                if ($scope.results.consented !== true) {
                    $scope.errors.push("You must consent to participate in this experiment.");
                }

//                if ($scope.results.ethicsStatementViewed !== true) {
//                    $scope.errors.push("You must view the ethics statement before continuing (click on the link please).")
//                }

//                if ($scope.loggedIn && $scope.userData) {
//                    $scope.results.userData = angular.copy($scope.userData);
//                }
//                else {
//                    $scope.errors.push("You must be signed in to participate in this experiment, please sign in.")
//                }

                if ($scope.results.name
                    && $scope.results.name.length > 0
                    && $scope.detailsForm.fullName.$valid
                    ) {

                }
                else {
                    $scope.errors.push("You must enter your name before continuing");
                }

                if ($scope.results.email
                    && $scope.results.email.length > 0
                    && $scope.detailsForm.email.$valid
                    ) {

                }
                else {
                    $scope.errors.push("You must enter a valid email address before continuing");
                }


                if (!$scope.isChrome()) {
                    $scope.errors.push("You must be using the Google Chrome web browser to continue.");
                }

                var allDownloaded = true;
                angular.forEach($scope.spec.additionalResources, function (value, key) {
                    allDownloaded = allDownloaded && angular.isObject(value);
                });

                if (!allDownloaded) {
                    $scope.errors.push("Resources for the experiment are still downloading. Try again in a moment.");
                }

                if ($scope.errors.length > 0) {
                    return;
                }

                $scope.step = 1;
                $scope.stage = $scope.EXPERIMENT_STAGE;

            };

            $scope.getPath = function () {
                if ($scope.spec && $scope.spec.experimentSteps && $scope.spec.experimentSteps[$scope.step - 1]) {

                    return $scope.spec.experimentSteps[$scope.step - 1].template
                }
            };

            $scope.$watch(function () {
                return $scope.step;
            }, function (newValue, oldValue) {
                if (newValue > $scope.spec.experimentSteps.length) {
                    $scope.finishExperiment();
                }
            });


            $scope.prettyResults = "";
            $scope.finishExperiment = function () {

                $scope.step = 0;
                $scope.stage = $scope.FINAL_STAGE;

                // send back results to server
                $scope.resultsSending = true;
                $scope.resultsSentSuccessfully = undefined;

                // filter results
                var blackList = $scope.blackList;
                var tempResult = JSON.stringify($scope.results, function (key, value) {
                    if (key !== "" && blackList.indexOf(key) >= 0) {
                        return undefined;
                    }

                    return value;
                });

                $scope.results = JSON.parse(tempResult);

                $scope.prettyResults = JSON.stringify($scope.results, undefined, 2);

                $http.post('/experiments', $scope.results)
                    .success(function (data, status, headers, config) {

                        $scope.resultsSending = false;
                        $scope.resultsSentSuccessfully = true;
                    })
                    .error(function (data, status, headers, config) {
                        $scope.resultsSending = false;
                        $scope.resultsSentSuccessfully = false;
                    });
            };
        }]);


    app.controller('RapidScanCtrl', ['$scope', '$resource', '$routeParams', '$route', '$http', '$timeout', 'Media', 'AudioEvent', 'Tag',
        function RapidScanCtrl($scope, $resource, $routeParams, $route, $http, $timeout, Media, AudioEvent, Tag) {
            function ts() {
                return (new Date()).toISOString();
            }

            var BASE_URL = "http://sensor.mquter.qut.edu.au/Spectrogram.ashx?ID={0}&start={1}&end={2}";
            $scope.ft = baw.secondsToDurationFormat;

            $scope.bigScope = $scope.$parent.$parent;
            $scope.bigScope.blackList = $scope.bigScope.blackList || [];
            $scope.bigScope.blackList = $scope.bigScope.blackList.concat(
                [
                    'notes',
                    '$$hashKey',
                    "template",
                    "notes",
                    "extraInstructions",
                    "show",
                    "downloaded"

                ]
            );

            //$scope.bigScope.results.steps = angular.copy($scope.bigScope.spec.experimentSteps);
            $scope.bigScope.results.version = $scope.bigScope.spec.version;

            // use the downloaded stats to configure the experiment
            // find minimum
            var minCount = null;
            angular.forEach($scope.bigScope.spec.additionalResources.experimentCombinationCounts, function (value, key) {
                var c = value.count;
                if (minCount === null || c < minCount) {
                    minCount = c;
                }
            });

            // extract minimums
            var lowestCodes = [];
            angular.forEach($scope.bigScope.spec.additionalResources.experimentCombinationCounts, function (value, key) {
                var c = value.count;
                if (c === minCount) {
                    lowestCodes.push(key);
                }
            });

            // randomly pick from the lowest group
            var lowestCode;
            if (lowestCodes.length != 1) {
                var keys;

                if (lowestCodes.length == 0) {
                    console.error("no lowest codes", lowestCodes, $scope.bigScope.spec.additionalResources);
                    throw "No lowest codes.";
                    //keys = Object.keys($scope.bigScope.spec.additionalResources.experimentCombinationCounts);
                    //keys = Object.keys($scope.bigScope.spec.additionalResources.experimentCombinationCounts);
                } else {
                    keys = lowestCodes;
                }
                var rand = Math.floor(Math.random() * keys.length);
                lowestCode = keys[rand];
            }
            else {
                lowestCode = lowestCodes[0];
            }

            if (!lowestCode || lowestCode.length !== 2) {
                throw "Experiment configuration incorrect";
            }

            // record experiment setup in results
            $scope.bigScope.results.code = lowestCode;
            var countSpec = $scope.bigScope.spec.additionalResources.experimentCombinationCounts[lowestCode];
            console.log("Experiment " + lowestCode + " chosen", countSpec);

            // now copy in the steps and configure the speeds
            $scope.bigScope.results.steps = [];
            for (var stepIndex = 0; stepIndex < countSpec.dataSets.length; stepIndex++) {
                // find the speed obj
                var dsId = countSpec.dataSets[stepIndex];
                var dataSet = angular.copy(
                    $scope.bigScope.spec.experimentSteps.filter(function (value) {
                        return value.id === dsId;
                    })[0]
                );

                // find the step obj
                var sId = countSpec.speeds[stepIndex];
                var speed = angular.copy(
                    $scope.bigScope.spec.speeds.filter(function (value) {
                        return value.speed === sId;
                    })[0]
                );

                // merge speed and step
                dataSet.speed = speed;

                // insert into results
                $scope.bigScope.results.steps.push(dataSet);
            }

            // lastly, insert training round at start
            var trainingStep = angular.copy(
                $scope.bigScope.spec.experimentSteps.filter(function (value) {
                    return value.id === "training";
                })[0]);
            $scope.bigScope.results.steps.unshift(trainingStep);

            // print order for sanity
            // also attach to results for later sanity
            var prettyString = "Experimental step order";
            var order = "";
            $scope.bigScope.results.order = [];
            angular.forEach($scope.bigScope.results.steps, function (value, index) {
                $scope.bigScope.results.order.push({index: index, speed: value.speed.speed, id: value.id});
                prettyString += String.format("\nIndex: {0}, Speed: {1}, Id: {2}", index, value.speed.speed, value.id);
                order += value.speed.speed + "\t";
            });
            console.warn(order);
            console.warn(prettyString);


            $scope.stepResults = undefined;
            var EXPERIMENT_STEPS = $scope.bigScope.results.steps.length;
            $scope.$watch(function () {
                return $scope.bigScope.step;
            }, function (newValue, oldValue) {
                if (newValue <= EXPERIMENT_STEPS) {

                    $scope.showInstructions = true;

                    $scope.stepResults = $scope.bigScope.results.steps[$scope.bigScope.step - 1];

                    $scope.stepResults.flashes = calculateFlashes();

                    // start checking for images that are downloading
                    console.info("starting download loop...");
                    downloading();
                }
            });

            $scope.totalDownloaded = 0;
            function downloading() {
                var total = 0;

                total = $(".imageList img")
                    .toArray()
                    .reduce(
                    function (prev, value, index, array) {
                        return prev + value.complete
                    },
                    0
                );

                $scope.totalDownloaded = total;

                if ($scope.stepResults.flashes.length != $scope.totalDownloaded) {
                    $timeout(downloading, 250);
                }
                else {
                    console.info("finished download.");
                }

                return total;
            }

            $scope.showInstructions = true;
            $scope.showDoneButton = false;
            $scope.start = function () {
                $scope.showInstructions = false;
                $scope.stepResults.preCountDownStartTimeStamp = ts();

                $scope.stepResults.flashes[0].show = true;
                $scope.currentFlash = 0;
                $scope.segment = $scope.stepResults.flashes[$scope.currentFlash];

                $scope.countDown = $scope.bigScope.spec.countDown;

                $scope.showDoneButton = false;

                // actually start it after countdown
                countDown();

            };

            function countDown() {
                window.setTimeout(function () {
                        $scope.$apply(function () {
                            $scope.countDown = $scope.countDown - 1;

                            if ($scope.countDown == 0) {

                                // eventually start it!
                                $scope.stepResults.startTimeStamp = ts();

                                $scope.tick();
                                focus();
                                $timeout(function () {
                                    focus();
                                })
                            }
                            else {
                                countDown();
                            }
                        });
                    },
                    1000)
            }


            $scope.lastTick = $scope.pauseTick = undefined;
            $scope.paused = false;
            $scope.pauseOrResume = function () {
                if ($scope.paused) {
                    var diff = $scope.remainingTime - ($scope.pauseTick - $scope.lastTick);

                    $scope.paused = false;

                    console.warn("resuming with delay:" + diff);
                    $scope.pauseTick = 0;
                    $scope.stepResults.flashes[$scope.currentFlash].pauses.push({state: "resumed", timeStamp: ts()});
                    // var tempTimer = $timeout(function () {
                    $scope.tick(diff);
                    //$timeout.cancel(tempTimer);
                    // }, diff);
                } else {
                    $scope.pauseTick = Date.now();

                    //window.clearTimeout($scope.timeoutId);
                    $timeout.cancel($scope.timeoutId);

                    $scope.paused = true;
                    $scope.stepResults.flashes[$scope.currentFlash].pauses.push({state: "paused", timeStamp: ts()});
                }


            };

            function focus() {
                // bad voodoo
                document.getElementById('experimentKeyPressDiv').focus();
            }

            $scope.animationControl = function () {
                return $scope.paused || $scope.countDown ? "paused" : "running";
            };


            $scope.animationText = "";
            function animationTextUpdate(enable) {
                //return 'collapseWidthLeft ' + $scope.stepResults.speed  + 's linear 0s'

                // this is how we reset the animation
                if (!enable) {
                    $scope.animationText = "";
                }

                $scope.animationText = $scope.stepResults.speed.speed + 's linear 0s infinite'
            }

            $scope.tick = function (delay) {
                focus();

//                // need to record ticks, except for when resuming...
//                // because tick technically only happen when it 'ticks'
//                // and not when resuming from pause
//                if (!delay) {
//
//                }

                var actualDelay = delay === undefined ? $scope.stepResults.speed.speed * 1000 : delay;
                $scope.remainingTime = actualDelay;
                $scope.lastTick = Date.now();

                animationTextUpdate(true);

                //$scope.timeoutId = window.setTimeout(function () {
                $scope.timeoutId = $timeout(function () {
                        if ($scope.paused) {
                            // exit early to disable timer
                            //window.clearTimeout($scope.timeoutId);
                            $timeout.cancel($scope.timeoutId);
                            return;
                        }

                        // this seems like a huge waste... but I can't figure out how to do this better
//                        $scope.$apply(function() {
//                           animationTextUpdate(false);
//                        });

                        //$scope.$apply(function () {
                        animationTextUpdate(true);

                        // hide the old image
                        $scope.stepResults.flashes[$scope.currentFlash].show = false;

                        // increment the flashcard
                        $scope.currentFlash++;
                        // bind a new data object
                        $scope.segment = $scope.stepResults.flashes[$scope.currentFlash];

                        focus();


                        if ($scope.currentFlash >= $scope.stepResults.flashes.length) {
                            $scope.stepResults.endFlashesTimeStamp = (new Date()).toISOString();
                            $scope.showDoneButton = true;
                            return;
                        }

                        //$scope.lastTick = Date.now();

                        $scope.stepResults.flashes[$scope.currentFlash].show = true;

                        $scope.tick();
                        //});
                    },
                    actualDelay
                );
            };

            $scope.hit = function ($event) {
                var positiveHit = undefined;
                switch ($event.keyCode) {
                    // ctrl
                    case 17:
                        positiveHit = $event.originalEvent.keyLocation == 2;
                        break;
                    // shift
                    case 16:
                        positiveHit = $event.originalEvent.keyLocation == 2;
                        break;
                    // right arrow key
                    case 39:
                        positiveHit = true;
                        break;
                    // left arrow key
                    case 37:
                        positiveHit = false;
                        break;
                }

                if (positiveHit == undefined || $scope.currentFlash >= $scope.stepResults.flashes.length) {
                    console.warn("ignored hit");
                    return;
                }
                var result = positiveHit ? "positive" : "negative";
                console.log("HIT!" /*, $event*/, result);

                var f = $scope.stepResults.flashes[$scope.currentFlash];
                f.detected = result;
                f.hits.push({hit: result, timeStamp: ts()});
            };


            $scope.end = function () {
                $scope.stepResults.endTimeStamp = ts();
                window.clearTimeout($scope.timeoutId);
                $scope.bigScope.step = $scope.bigScope.step + 1;

            };

            $scope.SPECTROGRAM_WIDTH = 1080;
            var PPS = 45;
            //$scope.stepResults.flashes = [];

            function calculateFlashes() {

                // work out the scale of flash cards that need to be shown
                var adjustedPPS = PPS * $scope.stepResults.compression,
                    segmentDuration = $scope.SPECTROGRAM_WIDTH / adjustedPPS;

                var segments = [];
                for (var segmentIndex = 0; segmentIndex < $scope.stepResults.segments.length; segmentIndex++) {
                    var segment = $scope.stepResults.segments[segmentIndex];
                    var durationSeconds = segment.endTime - segment.startTime;

                    var numberOfSegments = durationSeconds / segmentDuration;

                    for (var i = 0; i < numberOfSegments; i++) {
                        var start = segment.startTime + (i * segmentDuration),
                            end = start + segmentDuration;

                        var imageUrl = String.format(BASE_URL, segment.audioId, start * 1000, end * 1000);

                        segments.push({
                                start: start,
                                end: end,
                                audioId: segment.audioId,
                                imageLink: imageUrl,
                                show: false,
                                detected: null,
                                hits: [],
                                pauses: [],
                                downloaded: null
                            }
                        );
                    }
                }

                if ($scope.stepResults.randomiseOrder) {
                    baw.shuffle(segments);
                }

                // give flash cards index, so we always know order
                // has to happen after shuffle
                for (var counter = 0; counter < segments.length; counter++) {
                    segments[counter].index = counter;
                }

                return segments;
            }
        }]);

    app.controller('VirtualBirdTourCtrl', ['$scope', '$resource', '$routeParams', '$route', '$http', 'Media', 'AudioEvent', 'Tag',
        function VirtualBirdTourCtrl($scope, $resource, $routeParams, $route, $http, Media, AudioEvent, Tag) {

            /*
             * TO DO:
             *  - choose more species
             *  - load annotation YES, No, Unsure counts
             *  - survey?
             */

            /*
             "A12B12C12": {
             "count": 0,
             "items": [
             { "location":"A", "species": [1, 2] },
             { "location":"B", "species": [1, 2] },
             { "location":"C", "species": [1, 2] }
             ]
             }
             */

            //================
            // initialisation
            //=================

            var BASE_SPECTROGRAM_URL = "http://sensor.mquter.qut.edu.au/Spectrogram.ashx?ID={0}&start={1}&end={2}";
            var BASE_LOCAL_SPECTROGRAM_URL = "/experiment_assets/bird_tour/media/{0}_{1}_{2}.jpg";

            var BASE_EXTERNAL_AUDIO_URL = "http://sensor.mquter.qut.edu.au/AudioReading.ashx?ID={0}&Type={3}&start={1}&end={2}";
            var BASE_LOCAL_AUDIO_URL = "/experiment_assets/bird_tour/media/{0}_{1}_{2}.{3}"; // for webm

            var STEP_TYPE_TRANSITION = 'transition';
            var STEP_TYPE_ACTIVITY = 'activity';


            var ANNOTATION_TYPE_TO_VERIFY = 'toVerify';
            var ANNOTATION_TYPE_EXAMPLE = 'example';

            var BASE_ZOOM = 6;
            var CURRENT_LOCATION_ZOOM = 4;

            var PPMS = 0.04306640625;
            var SPECTROGRAM_PADDING_MS = Math.floor(20 / PPMS);

            $scope.bigScope = $scope.$parent.$parent;
            $scope.bigScope.blackList = $scope.bigScope.blackList || [];
            $scope.bigScope.blackList = $scope.bigScope.blackList.concat(
                [
                    'faunaImage',
                    'faunaImageAttribution',
                    'faunaImageAttributionLink',
                    'distributionImage',
                    'distributionImageAttribution',
                    'distributionImageAttributionLink',
                    'description',
                    'descriptionAttribution',
                    'descriptionAttributionLink',
                    "locationDescription",
                    "locationDescriptionAttribution",
                    "locationDescriptionAttributionLink",
                    "backgroundImageName",
                    "backgroundImageAttribution",
                    "backgroundImageAttributionLink",
                    "environmentType",
                    "environmentDescription",
                    "environmentDescriptionAttribution",
                    "environmentDescriptionAttributionLink"
                ]
            );

            $scope.bigScope.results.version = $scope.bigScope.spec.version;

            $scope.locations = angular.copy($scope.bigScope.spec.locations);
            $scope.species = angular.copy($scope.bigScope.spec.species);
            $scope.annotations = angular.copy($scope.bigScope.spec.annotations);

            $scope.transitionMarkers = [];
            $scope.currentStepResults = undefined;
            $scope.transitionMapInfoWindow = new google.maps.InfoWindow({maxWidth: 600});
            $scope.doneButtonClicked = false;
            $scope.doneButtonClicked = false;

            //================
            // define functions for template
            //=================

            $scope.userHasMadeSelectionForAllVerifyAnnotations = function () {
                if ($scope.doneButtonClicked === true || !$scope.currentStepResults || !$scope.currentStepResults.responses) {
                    // hide done button
                    return false;
                }


                var responsesCount = 0;
                for (var key in $scope.currentStepResults.responses) {
                    if ($scope.currentStepResults.responses.hasOwnProperty(key) && key.indexOf('response') !== -1) {
                        responsesCount += 1;
                    }
                }

                var totalToVerify = $scope.currentVerify.length;
                return responsesCount == totalToVerify;
            };

            $scope.verifyDone = function () {
                $scope.addAction(null, 'done', 'button click');
                $scope.doneButtonClicked = true;
            };

            $scope.nextStep = function () {
                $scope.addAction(null, 'next', 'button click');
                $scope.bigScope.step = $scope.bigScope.step + 1;

                // remove background image
                if ($scope.bigScope.results.steps.length === $scope.bigScope.step) {
                    angular.element(document.getElementById('page-wrapper')).css("background-image", '');
                }
            };

            $scope.responseSelected = function (annotationId, response) {
                $scope.addAction(annotationId, response, 'response selected');
            };

            $scope.playAudio = function (audioElementId) {
                $scope.addAction(audioElementId, 'play', 'played audio');

                var audioElement = document.getElementById(audioElementId);
                if (audioElement) {
                    audioElement.currentTime = 0;
                    audioElement.play();


                }
            };

            $scope.showTransitionMap = function () {
                return $scope.currentStepResults && $scope.currentStepResults.stepType == STEP_TYPE_TRANSITION;
            };

            $scope.firstStop = function () {
                return $scope.step === 1;
            };

            $scope.middleStops = function () {
                return $scope.step > 1 && $scope.step < $scope.results.steps.length;
            };

            $scope.moveToWaypoint = function () {
                $scope.addAction(null, 'move to waypoint', 'button click');

                $scope.moveAndShowToLocation();
            };

            $scope.ensureMapDisplayedCorrectlyNoTimeout = function (map, latLng, zoom, marker, markerContent, markerTitle) {

                google.maps.event.trigger(map, 'resize');

                map.panTo(latLng);
                map.setZoom(zoom);


                if (marker && markerContent) {
                    $scope.showMarkerInfo(map, marker, markerContent);
                }

                if (marker && markerTitle) {
                    marker.setPosition(latLng);
                    marker.setTitle(markerTitle);
                }
            };

            $scope.ensureMapDisplayedCorrectly = function (map, latLng, zoom, marker, markerContent, markerTitle) {
                var timeoutId = setTimeout(function () {
                    $scope.$safeApply2(function () {
                        $scope.ensureMapDisplayedCorrectlyNoTimeout(map, latLng, zoom, marker, markerContent, markerTitle);
                    });
                }, 600);
            };

            //================
            // define functions for controller
            //=================

            $scope.getTimestamp = function () {
                return (new Date()).toISOString();
            };

            $scope.getLowestCountItem = function (containingObject) {
                console.log('called $scope.getLowestCountItem', containingObject);
                // find minimum
                var minCount = null;
                angular.forEach(containingObject, function (value, key) {
                    var c = value.count;
                    if (minCount === null || c < minCount) {
                        minCount = c;
                    }
                });

                // extract minimums
                var lowestCodes = [];
                angular.forEach(containingObject, function (value, key) {
                    var c = value.count;
                    if (c === minCount) {
                        lowestCodes.push(key);
                    }
                });

                // randomly pick from the lowest group
                var lowestCode;
                if (lowestCodes.length != 1) {
                    var keys;

                    if (lowestCodes.length == 0) {
                        console.error("[Bird Tour Experiment] no lowest codes", lowestCodes, containingObject);
                        throw "No lowest codes..";
                    } else {
                        keys = lowestCodes;
                    }
                    var rand = Math.floor(Math.random() * keys.length);
                    lowestCode = keys[rand];
                }
                else {
                    lowestCode = lowestCodes[0];
                }

                if (!lowestCode) {
                    console.error("[Bird Tour Experiment] configuration incorrect", lowestCode, containingObject);
                    throw "Experiment configuration incorrect";
                }

                return lowestCode;
            };

            $scope.getExamplesForSpecies = function (speciesCommonName) {
                var annotations = angular.copy($scope.annotations.filter(function (element, index, array) {
                    return element.type == ANNOTATION_TYPE_EXAMPLE && element.speciesCommonName == speciesCommonName;
                }));

                $scope.addMediaUrlsToAnnotations(annotations);

                // random order
                baw.shuffle(annotations);

                // record order
                for (var exampleAnnotationIndex = 0; exampleAnnotationIndex < annotations.length; exampleAnnotationIndex++) {
                    $scope.currentStepResults.annotationExampleOrder.push({
                        'index': exampleAnnotationIndex,
                        'step': $scope.step,
                        'annotationId': annotations[exampleAnnotationIndex].id,
                        'locationName': $scope.currentLocation.name,
                        'speciesCommonName': $scope.currentSpecies.commonName
                    });
                }

                return annotations;
            };

            $scope.getItemToVerifyForSpecies = function (speciesCommonName) {

                var speciesInfo = $scope.getSpeciesInfo(speciesCommonName);

                var annotations = angular.copy($scope.annotations.filter(function (element, index, array) {
                    return element.type == ANNOTATION_TYPE_TO_VERIFY && speciesInfo.annotationIds.indexOf(element.id) !== -1;
                }));

                $scope.addMediaUrlsToAnnotations(annotations);

                $scope.addResponseCounts(annotations);

                // random order
                baw.shuffle(annotations);

                // record order
                for (var verifyAnnotationIndex = 0; verifyAnnotationIndex < annotations.length; verifyAnnotationIndex++) {
                    $scope.currentStepResults.annotationVerifyOrder.push({
                        'index': verifyAnnotationIndex,
                        'step': $scope.step,
                        'annotationId': annotations[verifyAnnotationIndex].id,
                        'locationName': $scope.currentLocation.name,
                        'speciesCommonName': $scope.currentSpecies.commonName
                    });
                }

                return annotations;
            };

            $scope.addMediaUrlsToAnnotations = function (annotations) {
                angular.forEach(annotations, function (value, key) {

                    var startMs = Math.max(0, value.offsetStart - SPECTROGRAM_PADDING_MS);
                    var endMs = value.offsetEnd + SPECTROGRAM_PADDING_MS;

                    value.spectrogramImage = String.format(BASE_LOCAL_SPECTROGRAM_URL, value.audioId, startMs, endMs);
                    value.audioWebm = String.format(BASE_LOCAL_AUDIO_URL, value.audioId, startMs, endMs, 'webm');
                    value.audioOga = String.format(BASE_EXTERNAL_AUDIO_URL, value.audioId, startMs, endMs, 'ogg');
                    value.audioMp3 = String.format(BASE_EXTERNAL_AUDIO_URL, value.audioId, startMs, endMs, 'mp3');
                });
            };

            $scope.addResponseCounts = function (annotations) {
                angular.forEach(annotations, function (value, key) {

                    var response_counts = $scope.annotationResponseCounts[value.id];

                    if (response_counts) {
                        value.otherPeopleTotal = response_counts.total ? response_counts.total : 0;
                        value.otherPeopleYes = response_counts.yes ? response_counts.yes : 0;
                        value.otherPeopleNo = response_counts.no ? response_counts.no : 0;
                        value.otherPeopleUnsure = response_counts.unsure ? response_counts.unsure : 0;

                        //console.log(value);
                    } else {
                        value.otherPeopleTotal = 0;
                        value.otherPeopleYes = 0;
                        value.otherPeopleNo = 0;
                        value.otherPeopleUnsure = 0;
                    }


                    if (value.otherPeopleTotal > 0) {
                        // now calculate percentages
                        value.otherPeopleYes = value.otherPeopleYes / value.otherPeopleTotal * 100;
                        value.otherPeopleNo = value.otherPeopleNo / value.otherPeopleTotal * 100;
                        value.otherPeopleUnsure = value.otherPeopleUnsure / value.otherPeopleTotal * 100;
                    }


                    /*


                     $scope.annotationResponseCounts
                     */


                    /*
                     .filter(function (element, index, array) {
                     return element.type == ANNOTATION_TYPE_EXAMPLE && element.speciesCommonName == speciesCommonName;
                     }
                     $scope.annotatonResponseCounts['id']
                     */
                });
            };

            $scope.addMarkerClick = function (map, marker, content) {
                google.maps.event.addListener(marker, 'click', function () {
                    $scope.showMarkerInfo(map, marker, content);
                });
            };

            $scope.showMarkerInfo = function (map, marker, content) {
                $scope.transitionMapInfoWindow.setContent(content);
                $scope.transitionMapInfoWindow.open(map, marker);
            };

            $scope.getLocation = function (name) {
                var found = $scope.locations.filter(function (element, index, array) {
                    return (element.name == name);
                });
                if (found.length == 1) {
                    return found[0];
                }
                return null;
            };

            $scope.getMapForLocation = function (locationName, zoom) {
                var locationInfo = $scope.getLocation(locationName);
                if (locationInfo) {
                    //var locationEncoded = baw.angularCopies.encodeUriQuery(locationInfo.name, true);
                    var markerEncoded = baw.angularCopies.encodeUriQuery("color:0x7a903c|label:W|" + locationInfo.lat + "," + locationInfo.long, true);
                    var styleEncoded1 = baw.angularCopies.encodeUriQuery("style=feature:administrative", true);
                    var styleEncoded2 = baw.angularCopies.encodeUriQuery("style=feature:landscape.natural", true);
                    var styleEncoded3 = baw.angularCopies.encodeUriQuery("style=feature:water", true);
                    return "https://maps.googleapis.com/maps/api/staticmap?sensor=false&size=200x200&maptype=hybrid&markers=" + markerEncoded +
                        "&zoom=" + zoom;
                }
                return null;
            };

            $scope.getSpeciesInfo = function (speciesCommonName) {
                var found = $scope.species.filter(function (element, index, array) {
                    return (element.commonName == speciesCommonName);
                });
                if (found.length == 1) {
                    return found[0];
                }
                return null;
            };

            $scope.getLocationByOrderIdentifier = function (orderId) {
                var found = $scope.locations.filter(function (element, index, array) {
                    return (element.locationOrderIdentifier == orderId);
                });
                if (found.length == 1) {
                    return found[0];
                }
                return null;
            };


            $scope.addAction = function (elementId, action, type) {
                var actionObject = {
                    "elementId": elementId,
                    "action": action,
                    "type": type,
                    "timestamp": $scope.getTimestamp()
                };
                $scope.currentStepResults.actions.push(actionObject);
            };


            $scope.getTransitionMarkerDetails = function (locationName) {
                var found = $scope.transitionMarkers.filter(function (element, index, array) {
                    return (element.locationName == locationName);
                });
                if (found.length == 1) {
                    return found[0];
                }
                return null;
            };

            $scope.createMap = function (elementId, LatLng, zoom) {
                return new google.maps.Map(
                    document.getElementById(elementId),
                    {
                        center: LatLng,
                        zoom: zoom,
                        mapTypeId: google.maps.MapTypeId.HYBRID
                    }
                );
            };

            $scope.createMarker = function (map, LatLng, title) {
                return new google.maps.Marker({
                    position: LatLng,
                    map: map,
                    title: title
                });
            };

            $scope.moveAndShowFromLocation = function () {
                if ($scope.currentStepResults.stepType == STEP_TYPE_TRANSITION) {
                    $scope.showContinueButton = false;

                    var fromLocation = null;
                    var fromLatLng = null;
                    var fromDetails = null;

                    if ($scope.currentStepResults.fromLocation) {
                        // show the from location info window, pan to the location
                        fromLocation = $scope.getLocation($scope.currentStepResults.fromLocation.name);
                        fromLatLng = new google.maps.LatLng(fromLocation.lat, fromLocation.long);

                        fromDetails = $scope.getTransitionMarkerDetails($scope.currentStepResults.fromLocation.name);


                        $scope.ensureMapDisplayedCorrectly($scope.transitionMap, fromLatLng, BASE_ZOOM,
                            fromDetails.marker, fromDetails.content);

                    } else {
                        // first waypoint, start at middle of australia
                        $scope.transitionMap.panTo(new google.maps.LatLng(-24.287027, 134.208984));
                        $scope.transitionMap.setZoom(4);
                    }
                }
            };

            $scope.moveAndShowToLocation = function () {
                if ($scope.currentStepResults.stepType == STEP_TYPE_TRANSITION) {
                    $scope.showContinueButton = false;

                    var toLocation = null;
                    var toLatLng = null;
                    var toDetails = null;

                    if ($scope.currentStepResults.toLocation) {

                        // show the from location info window, pan to the location
                        toLocation = $scope.getLocation($scope.currentStepResults.toLocation.name);
                        toLatLng = new google.maps.LatLng(toLocation.lat, toLocation.long);

                        toDetails = $scope.getTransitionMarkerDetails($scope.currentStepResults.toLocation.name);

                        // change the background image
                        angular.element(document.getElementById('page-wrapper'))
                            .css("background-image", "url('" + $scope.getImagePath(toLocation.backgroundImageName) + "')");

                        $scope.ensureMapDisplayedCorrectly($scope.transitionMap, toLatLng, BASE_ZOOM,
                            toDetails.marker, toDetails.content);

                        $scope.showContinueButton = true;
                    }
                }
            };

            $scope.getImagePath = function (imageFileName) {
                return '/experiment_assets/bird_tour/' + imageFileName;
            };


            //================
            // perform set up
            //=================

            // create and init maps and markers
            var middleAustralia = new google.maps.LatLng(-24.287027, 134.208984);
            $scope.transitionMap = $scope.createMap('transitionMap', middleAustralia, CURRENT_LOCATION_ZOOM);
            $scope.locationMap = $scope.createMap('locationMap', middleAustralia, CURRENT_LOCATION_ZOOM);
            $scope.locationMarker = $scope.createMarker($scope.locationMap, middleAustralia, $scope.currentLocationName);

            // get order for locations and species
            // use the downloaded stats to configure the experiment
            // find least-used location order
            var locationOrderId = $scope.getLowestCountItem($scope.bigScope.spec.additionalResources.experimentCombinationCounts.locations);

            var locationSpeciesOrder = {};
            locationSpeciesOrder.locations = $scope.bigScope.spec.additionalResources.experimentCombinationCounts.locations[locationOrderId].locations;
            locationSpeciesOrder.species = {};

            angular.forEach($scope.bigScope.spec.additionalResources.experimentCombinationCounts.species, function (value, key) {
                var currentSpeciesInfo = $scope.bigScope.spec.additionalResources.experimentCombinationCounts.species[key];
                var speciesOrderLowestCountId = $scope.getLowestCountItem(value);
                locationSpeciesOrder.species[key] = currentSpeciesInfo[speciesOrderLowestCountId].species;
            });

            $scope.bigScope.results.locationSpeciesOrder = locationSpeciesOrder;
            console.log('[Bird Tour Experiment] location and species order.', JSON.stringify(locationSpeciesOrder, undefined, 4));

            // store annotation response counts
            $scope.annotationResponseCounts = $scope.bigScope.spec.additionalResources.annotationsResponseCounts;

            //================
            // now copy in the steps and configure the locations and species
            //=================

            $scope.bigScope.results.steps = [];

            for (var locationStepIndex = 0; locationStepIndex < locationSpeciesOrder.locations.length; locationStepIndex++) {

                var locationId = locationSpeciesOrder.locations[locationStepIndex];

                // add the transition step
                var transitionStep = angular.copy(
                    $scope.bigScope.spec.experimentSteps.filter(function (value) {
                        return value.stepType === STEP_TYPE_TRANSITION;
                    })[0]
                );
                if (locationStepIndex == 0) {
                    transitionStep.fromLocation = null;
                } else {
                    var prevLocationId = locationSpeciesOrder.locations[locationStepIndex - 1];
                    transitionStep.fromLocation = $scope.getLocationByOrderIdentifier(prevLocationId);
                }

                // always add the to location
                transitionStep.toLocation = $scope.getLocationByOrderIdentifier(locationId);

                $scope.bigScope.results.steps.push(transitionStep);

                if (transitionStep.toLocation) {
                    // add the species steps
                    for (var speciesStepIndex = 0; speciesStepIndex < locationSpeciesOrder.species[locationId].length; speciesStepIndex++) {

                        var speciesOrderId = locationSpeciesOrder.species[locationId][speciesStepIndex];

                        var speciesStep = angular.copy(
                            $scope.bigScope.spec.experimentSteps.filter(function (value) {
                                return value.stepType === STEP_TYPE_ACTIVITY;
                            })[0]
                        );
                        speciesStep.location = transitionStep.toLocation;
                        speciesStep.species = angular.copy($scope.bigScope.spec.species.filter(function (value) {
                            return value.locationName === speciesStep.location.name && value.locationSpeciesOrderIdentifier == speciesOrderId;
                        })[0]);

                        $scope.bigScope.results.steps.push(speciesStep);
                    }
                }

                // if this is the last location, add an additional transition at the end
                if (locationStepIndex == locationSpeciesOrder.locations.length - 1) {
                    var lastStep = angular.copy(transitionStep);
                    lastStep.fromLocation = angular.copy(lastStep.toLocation);
                    lastStep.toLocation = null;
                    $scope.bigScope.results.steps.push(lastStep);
                }
            }

            // print order for sanity
            $scope.bigScope.results.order = [];
            angular.forEach($scope.bigScope.results.steps, function (value, index) {

                if (value.stepType == STEP_TYPE_TRANSITION) {
                    $scope.bigScope.results.order.push({
                        index: index,
                        fromLocationName: value.fromLocation ? value.fromLocation.name : null,
                        fromLocationOrderIdentifier: value.fromLocation ? value.fromLocation.locationOrderIdentifier : null,
                        toLocationName: value.toLocation ? value.toLocation.name : null,
                        toLocationOrderIdentifier: value.toLocation ? value.toLocation.locationOrderIdentifier : null
                    });
                } else if (value.stepType == STEP_TYPE_ACTIVITY) {
                    $scope.bigScope.results.order.push({
                        index: index,
                        locationName: value.location ? value.location.name : null,
                        locationOrderIdentifier: value.location ? value.location.locationOrderIdentifier : null,
                        speciesCommonName: value.species ? value.species.commonName : null,
                        locationSpeciesOrderIdentifier: value.species ? value.species.locationSpeciesOrderIdentifier : null
                    });
                } else {
                    console.error("[Bird Tour Experiment] Invalid value for stepType.", value);
                }
            });
            console.info('[Bird Tour Experiment] step order', JSON.stringify($scope.bigScope.results.order, undefined, 4));

            var stepCount = $scope.bigScope.results.steps.length;

            $scope.$watch(function () {
                return $scope.bigScope.step;
            }, function (newValue, oldValue) {
                if (newValue <= stepCount) {
                    $scope.currentStepResults = $scope.bigScope.results.steps[$scope.bigScope.step - 1];

                    $scope.currentStepResults.actions = [];
                    $scope.currentStepResults.annotationExampleOrder = [];
                    $scope.currentStepResults.annotationVerifyOrder = [];

                    if ($scope.currentStepResults.stepType == STEP_TYPE_ACTIVITY) {
                        // show the species information and annotation verification activity.

                        $scope.currentStepResults.startTimestamp = $scope.getTimestamp();
                        $scope.currentStepResults.responses = {};

                        $scope.currentLocation = $scope.getLocation($scope.currentStepResults.location.name);
                        $scope.currentSpecies = $scope.getSpeciesInfo($scope.currentStepResults.species.commonName);

                        $scope.currentLocationName = $scope.currentLocation.name + " (" + $scope.currentLocation.environmentType + ")";

                        $scope.currentExamples = $scope.getExamplesForSpecies($scope.currentSpecies.commonName);
                        $scope.currentVerify = $scope.getItemToVerifyForSpecies($scope.currentSpecies.commonName);

                        // change the map
                        var theNewLocation = new google.maps.LatLng($scope.currentLocation.lat, $scope.currentLocation.long);

                        $scope.ensureMapDisplayedCorrectly($scope.locationMap, theNewLocation, CURRENT_LOCATION_ZOOM,
                            $scope.locationMarker, null, $scope.currentLocationName);

                        // user has clicked on Done button
                        $scope.doneButtonClicked = false;
                    } else if ($scope.currentStepResults.stepType == STEP_TYPE_TRANSITION) {

                        $scope.moveAndShowFromLocation();

                    }
                }
            });


            //================
            // create and store all locations for transition map
            //=================

            var MAP_LINE_COLOUR = 'yellow';
            var MAP_POINT_COLOUR = '#FF7F50';
            var MAP_LINE_ARROW_COLOUR = '#FFA500';

            // get array of steps that are transitions, then create all markers and arrows
            var transitionLocations = $scope.bigScope.results.steps.filter(function (element, index, array) {
                return (element.stepType == STEP_TYPE_TRANSITION && element.toLocation);
            });

            for (var orderedLocationIndex = 0; transitionLocations.length > orderedLocationIndex; orderedLocationIndex++) {
                var currentOrderedLocation = transitionLocations[orderedLocationIndex];

                var fromLocation = null;
                var fromLatLng = null;

                var toLocation = null;
                var toLatLng = null;

                if (currentOrderedLocation.toLocation) {
                    toLocation = $scope.getLocation(currentOrderedLocation.toLocation.name);
                    toLatLng = new google.maps.LatLng(toLocation.lat, toLocation.long);
                    var toContent = String.format(
                        '<div><h1>{0}</h1>' +
                            '<div style="float:right;margin:00 5px 5px;"><img style="width:200px;" src="{8}"><a href="{10}" class="mapAttribution" target="_blank">Source: {9}</a></div>' +
                            '<p>{1}</p>' +
                            '<a href="{3}" class="mapAttribution" target="_blank">Source: {2}</a>' +
                            '<h2>{4}</h2>' +
                            '<p>{5}</p>' +
                            '<a href="{7}" class="mapAttribution"  target="_blank">Source: {6}</a>' +
                            '</div>',
                        toLocation.name,
                        toLocation.locationDescription, toLocation.locationDescriptionAttribution, toLocation.locationDescriptionAttributionLink,
                        toLocation.environmentType,
                        toLocation.environmentDescription, toLocation.environmentDescriptionAttribution, toLocation.environmentDescriptionAttributionLink,
                        $scope.getImagePath(toLocation.backgroundImageName),
                        toLocation.backgroundImageAttribution, toLocation.backgroundImageAttributionLink
                    );
                    var toMarker = new google.maps.Marker({
                        position: toLatLng,
                        map: $scope.transitionMap,
                        title: toLocation.name,
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 5,
                            fillOpacity: 1,
                            //fillColor: MAP_POINT_COLOUR,
                            strokeColor: MAP_POINT_COLOUR
                        }
                    });

                    $scope.addMarkerClick($scope.transitionMap, toMarker, toContent);
                    $scope.transitionMarkers.push({locationName: currentOrderedLocation.toLocation.name, latLng: toLatLng, marker: toMarker, content: toContent});

                }

                if (currentOrderedLocation.fromLocation && currentOrderedLocation.toLocation) {
                    fromLocation = $scope.getLocation(currentOrderedLocation.fromLocation.name);
                    fromLatLng = new google.maps.LatLng(fromLocation.lat, fromLocation.long);

                    toLocation = $scope.getLocation(currentOrderedLocation.toLocation.name);
                    toLatLng = new google.maps.LatLng(toLocation.lat, toLocation.long);

                    var arrowSymbol = {
                        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                        strokeColor: MAP_LINE_ARROW_COLOUR,
                        fillColor: MAP_LINE_ARROW_COLOUR,
                        fillOpacity: 1,
                        strokeOpacity: 1,
                        strokeWeight: 1
                    };

                    var lineSymbol = {
                        path: 'M 0,-1 0,1',
                        strokeColor: MAP_LINE_COLOUR,
                        strokeOpacity: 1,
                        strokeWeight: 2
                    };

                    var line = new google.maps.Polyline({
                        path: [fromLatLng, toLatLng],
                        strokeOpacity: 0,
                        icons: [
                            {
                                icon: lineSymbol,
                                offset: '0',
                                repeat: '20px'
                            },
                            {
                                icon: arrowSymbol,
                                offset: '50%'
                            },
                            {
                                icon: arrowSymbol,
                                offset: '95%'
                            }
                        ],
                        map: $scope.transitionMap
                    });
                }

            }


        }]);
})();
