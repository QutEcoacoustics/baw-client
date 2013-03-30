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

            $scope.prettyResults = function () {
                return JSON.stringify($scope.results, undefined, 2);
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
                    //$scope.stepResults.flashes.hits = [];
                    //$scope.stepResults.flashes.pauses = [];

                }
            });

            $scope.totalDownloaded = 0;
            $scope.downloading = function() {
              var total = 0;
//                angular.forEach($scope.stepResults.flashes, function(value, index) {
//                    if(value.downloaded === true) {
//                        total += 1;
//                    }
//                });

                return $("#step_"+$scope.bigScope.step +" img").toArray().every(function(value) {return value.complete});

                $scope.totalDownloaded = total;
                return total;
            };

            $scope.showInstructions = true;
            $scope.showDoneButton = false;
            $scope.start = function () {
                $scope.showInstructions = false;
                $scope.stepResults.preCountDownStartTimeStamp = ts();

                $scope.stepResults.flashes[0].show = true;
                $scope.currentFlash = 0;
                $scope.segment = $scope.flashes[$scope.currentFlash];

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
                                $scope.focus();
                                $timeout(function () {
                                    $scope.focus();
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
                    $scope.paused = false;


                    var diff = ($scope.stepResults.speed * 1000) - ($scope.pauseTick - $scope.lastTick);
                    $scope.pauseTick = 0;
                    $scope.stepResults.flashes[$scope.currentFlash].pauses.push({state: "resumed", timeStamp: ts()});
                    // var tempTimer = $timeout(function () {
                    $scope.tick(diff);
                    //$timeout.cancel(tempTimer);
                    // }, diff);
                } else {
                    window.clearTimeout($scope.timeoutId);
                    $scope.paused = true;
                    $scope.pauseTick = Date.now();
                    $scope.stepResults.flashes[$scope.currentFlash].pauses.push({state: "paused", timeStamp: ts()});
                }


            };

            $scope.focus = function () {
                // bad voodoo
                document.getElementById('experimentKeyPressDiv').focus();
            };

            $scope.animationControl = function () {
                return $scope.paused || $scope.countDown ? "paused" : "running";
            };

            $scope.animationText = function () {
                //return 'collapseWidthLeft ' + $scope.stepResults.speed  + 's linear 0s'
                return $scope.stepResults.speed.speed + 's linear 0s'
            };

            $scope.tick = function (delay) {
                $scope.focus();
                $scope.lastTick = Date.now();
                $scope.timeoutId = window.setTimeout(function () {
                        $scope.$apply(function () {
                            if ($scope.paused) {
                                // exit early to disable timer
                                window.clearTimeout($scope.timeoutId);
                                return;
                            }

                            $scope.stepResults.flashes[$scope.currentFlash].show = false;
                            $scope.currentFlash++;
                            $scope.segment = $stepResults.flashes[$scope.currentFlash];

                            $scope.focus();


                            if ($scope.currentFlash >= $scope.stepResults.flashes.length) {
                                $scope.stepResults.endFlashesTimeStamp = (new Date()).toISOString();
                                $scope.showDoneButton = true;
                                return;
                            }

                            $scope.lastTick = Date.now();

                            $scope.stepResults.flashes[$scope.currentFlash].show = true;

                            $scope.tick();
                        });
                    },
                    delay === undefined ? $scope.stepResults.speed.speed * 1000 : delay
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
                console.log("HIT!", $event, result);

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

            $scope.bigScope = $scope.$parent.$parent;

            $scope.bigScope.results.steps = angular.copy($scope.bigScope.spec.experimentSteps);

            $scope.locationMap = new google.maps.Map(document.getElementById("locationMap"),
                {center: new google.maps.LatLng(-24.287027, 134.208984),
                    zoom: 4,
                    mapTypeId: google.maps.MapTypeId.HYBRID});

            $scope.locationMarker = new google.maps.Marker({
                position: new google.maps.LatLng(-24.287027, 134.208984),
                map: $scope.locationMap,
                title: "Australia"
            });

            $scope.stepResults = undefined;
            $scope.$watch(function () {
                return $scope.bigScope.step;
            }, function (newValue, oldValue) {
                $scope.stepResults = $scope.bigScope.results.steps[$scope.bigScope.step - 1];
                $scope.stepResults.startTimestamp = (new Date()).toISOString();

                $scope.stepResults.responses = {};
                $scope.stepResults.actions = [];

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
            });

            $scope.selectedTab = "instructions";

            $scope.locations = angular.copy($scope.bigScope.spec.locations);
            $scope.species = angular.copy($scope.bigScope.spec.species);
            $scope.annotations = angular.copy($scope.bigScope.spec.annotations);

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
                if ($scope.doneButtonClicked === true) {
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

        }]);
})();
