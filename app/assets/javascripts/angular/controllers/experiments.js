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
                ethicsStatementViewed: false
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
                    if (attemptsLeft >= 0) {
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

                if ($scope.loggedIn && $scope.userData) {
                    $scope.results.userData = angular.copy($scope.userData);
                }
                else {
                    $scope.errors.push("You must be signed in to participate in this experiment, please sign in.")
                }

                if (!$scope.isChrome()) {
                    $scope.errors.push("You must be using the Google Chrome web browser to continue.")
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
                    "imageLink",
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
                    keys = Object.keys($scope.bigScope.spec.additionalResources.experimentCombinationCounts);
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

            // set up scope
            $scope.bigScope = $scope.$parent.$parent;
            $scope.bigScope.results.steps = angular.copy($scope.bigScope.spec.experimentSteps);

            $scope.locations = angular.copy($scope.bigScope.spec.locations);
            $scope.species = angular.copy($scope.bigScope.spec.species);
            $scope.annotations = angular.copy($scope.bigScope.spec.annotations);

            $scope.transitionMarkers = [];

            // set up current location map
            $scope.locationMap = new google.maps.Map(document.getElementById("locationMap"),
                {center: new google.maps.LatLng(-24.287027, 134.208984),
                    zoom: 4,
                    mapTypeId: google.maps.MapTypeId.HYBRID});

            $scope.locationMarker = new google.maps.Marker({
                position: new google.maps.LatLng(-24.287027, 134.208984),
                map: $scope.locationMap,
                title: "Australia"
            });

            // transition map
            $scope.transitionMap = new google.maps.Map(document.getElementById("transitionMap"),
                {center: new google.maps.LatLng(-24.287027, 134.208984),
                    zoom: 4,
                    mapTypeId: google.maps.MapTypeId.HYBRID});

            // steps and results
            $scope.stepResults = undefined;
            $scope.$watch(function () {
                return $scope.bigScope.step;
            }, function (newValue, oldValue) {
                $scope.stepResults = $scope.bigScope.results.steps[$scope.bigScope.step - 1];

                $scope.stepResults.actions = [];

                if ($scope.stepResults.stepType == "activity") {
                    // show the species information and annotation verification activity.

                    $scope.stepResults.startTimestamp = (new Date()).toISOString();

                    $scope.stepResults.responses = {};

                    $scope.currentLocation = $scope.getLocation($scope.stepResults.locationName);
                    $scope.currentLocationName = $scope.currentLocation.name + " (" + $scope.currentLocation.environmentType + ")";

                    $scope.currentLocationMapLocal = $scope.getMapForLocation($scope.stepResults.locationName, 14);
                    $scope.currentLocationMapArea = $scope.getMapForLocation($scope.stepResults.locationName, 6);
                    $scope.currentLocationMapCountry = $scope.getMapForLocation($scope.stepResults.locationName, 3);

                    $scope.currentSpecies = $scope.getSpeciesInfo($scope.stepResults.speciesCommonName);

                    $scope.currentExamples = $scope.annotations.filter(function (element, index, array) {
                        return ($scope.stepResults.exampleAnnotationIds.indexOf(element.id) != -1);
                    });

                    $scope.currentVerify = $scope.annotations.filter(function (element, index, array) {
                        return ($scope.stepResults.verifyAnnotationIds.indexOf(element.id) != -1);
                    });

                    // change the map
                    $scope.locationMap.setZoom(4);
                    $scope.locationMap.panTo(
                        new google.maps.LatLng($scope.currentLocation.lat, $scope.currentLocation.long));

                    // change the marker
                    $scope.locationMarker.setPosition(
                        new google.maps.LatLng($scope.currentLocation.lat, $scope.currentLocation.long));
                    $scope.locationMarker.setTitle($scope.currentLocationName);

                    // user has clicked on Done button
                    $scope.doneButtonClicked = false;
                } else if ($scope.stepResults.stepType == "transition") {
                    // show the large map, and move from one location to the next

                    $scope.showContinueButton = false;

                    var fromLocation = null;
                    var fromLatLng = null;
                    var fromDetails = null;

                    var toLocation = null;
                    var toLatLng = null;
                    var toDetails = null;

                    if ($scope.stepResults.fromLocationName) {
                        // show the from location info window, pan to the location
                        fromLocation = $scope.getLocation($scope.stepResults.fromLocationName);
                        fromLatLng = new google.maps.LatLng(fromLocation.lat, fromLocation.long);

                        fromDetails = $scope.getTransitionMarkerDetails($scope.stepResults.fromLocationName);

                        $scope.showMarkerInfo($scope.transitionMap, fromDetails.marker, fromDetails.content);

                        fromDetails.marker.setIcon({
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 10
                        });

                        $scope.transitionMap.panTo(fromLatLng);
                        $scope.transitionMap.setZoom(4);
                    }else{
                        // first waypoint, start at middle of australia
                        $scope.transitionMap.panTo(new google.maps.LatLng(-24.287027, 134.208984));
                        $scope.transitionMap.setZoom(4);
                    }

                    // stay at current location for a short time, then move.



                    if ($scope.stepResults.toLocationName) {

                        var t = setTimeout(function(){
                            // show the from location info window, pan to the location
                            toLocation = $scope.getLocation($scope.stepResults.toLocationName);
                            toLatLng = new google.maps.LatLng(toLocation.lat, toLocation.long);

                            toDetails = $scope.getTransitionMarkerDetails($scope.stepResults.toLocationName);

                            $scope.showMarkerInfo($scope.transitionMap, toDetails.marker, toDetails.content);

                            toDetails.marker.setIcon({
                                path: google.maps.SymbolPath.CIRCLE,
                                scale: 10
                            });

                            $scope.transitionMap.panTo(toLatLng);
                            $scope.transitionMap.setZoom(4);

                            $scope.$safeApply2(function(){
                                $scope.showContinueButton = true;
                            });
                        },3000);
                    }else{
                        // last waypoint, show a message of some sort

                    }
                }
            });

            $scope.addMarkerClick = function (map, marker, content) {
                google.maps.event.addListener(marker, 'click', function () {
                    $scope.showMarkerInfo(map, marker, content);
                });
            };

            $scope.showMarkerInfo = function (map, marker, content) {
                if (!$scope.transitionMapInfoWindow) {
                    $scope.transitionMapInfoWindow = new google.maps.InfoWindow({maxWidth: 200});
                }

                $scope.transitionMapInfoWindow.setContent(content);
                $scope.transitionMapInfoWindow.open(map, marker);
            }

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

            $scope.userHasMadeSelectionForAllVerifyAnnotations = function () {
                if ($scope.doneButtonClicked === true || !$scope.stepResults.responses) {
                    // hide done button
                    return false;
                }

                var responsesCount = Object.keys($scope.stepResults.responses).length;
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
            };

            $scope.responseSelected = function (annotationId, response) {
                $scope.addAction(annotationId, response, 'response selected');
            };

            $scope.playAudio = function (audioElementId) {
                var audioElement = document.getElementById(audioElementId);
                if (audioElement) {
                    audioElement.currentTime = 0;
                    audioElement.play();

                    $scope.addAction(audioElementId, 'play', 'played audio');
                }
            };

            $scope.addAction = function (elementId, action, type) {
                var actionObject = {
                    "elementId": elementId,
                    "action": action,
                    "type": type,
                    "timestamp": (new Date()).toISOString()
                };
                $scope.stepResults.actions.push(actionObject);
            };

            $scope.showTransitionMap = function () {
                return $scope.stepResults.stepType == "transition";
            };

            $scope.getTransitionLocations = function () {
                return $scope.bigScope.results.steps.filter(function (element, index, array) {
                    return (element.stepType == "transition");
                });
            };

            $scope.getTransitionMarkerDetails = function(locationName){
                var found = $scope.transitionMarkers.filter(function (element, index, array) {
                    return (element.locationName == locationName);
                });
                if (found.length == 1) {
                    return found[0];
                }
                return null;
            };

            // create and store all locations for transition map
            // get array of steps that are transitions, then create all markers and arrows
            var transitionLocations = $scope.getTransitionLocations();
            for (var orderedLocationIndex = 0; transitionLocations.length > orderedLocationIndex; orderedLocationIndex++) {

                var currentOrderedLocation = transitionLocations[orderedLocationIndex];

                if (currentOrderedLocation.toLocationName) {
                    var toLocation = $scope.getLocation(currentOrderedLocation.toLocationName);
                    var toLatLng = new google.maps.LatLng(toLocation.lat, toLocation.long);
                    var toContent = '<div><h1>' + toLocation.name +
                        '</h1><p><em>' + toLocation.environmentType +
                        '</em></p><p>' + toLocation.environmentDescription +
                        '</p></div>';
                    var toMarker = new google.maps.Marker({
                        position: toLatLng,
                        map: $scope.transitionMap,
                        title: toLocation.name
                    });

                    $scope.addMarkerClick($scope.transitionMap, toMarker, toContent);
                    $scope.transitionMarkers.push({locationName: currentOrderedLocation.toLocationName,latLng: toLatLng, marker: toMarker, content: toContent});
                }

                if (currentOrderedLocation.fromLocationName && currentOrderedLocation.toLocationName) {
                    var fromLocation = $scope.getLocation(currentOrderedLocation.fromLocationName);
                    var fromLatLng = new google.maps.LatLng(fromLocation.lat, fromLocation.long);

                    var toLocation = $scope.getLocation(currentOrderedLocation.toLocationName);
                    var toLatLng = new google.maps.LatLng(toLocation.lat, toLocation.long);

                    var arrowSymbol = {
                        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                        strokeColor: "#eeee00"
                    };

                    var lineSymbol = {
                        path: 'M 0,-1 0,1',
                        strokeColor: "#eeee00",
                        strokeOpacity: 1,
                        scale: 4
                    };

                    var line = new google.maps.Polyline({
                        path: [fromLatLng, toLatLng],
                        icons: [
                            {
                                icon: lineSymbol,
                                offset: '0',
                                repeat: '20px'
                            },
                            {
                                icon: arrowSymbol,
                                offset: '100%'
                            }
                        ],
                        map: $scope.transitionMap
                    });
                }

            }

        }]);
})();
