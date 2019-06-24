angular.module("bawApp.components.background", [])
    .service("backgroundImage", ["conf.paths", function (paths) {
        var currentBackground = "";

        var self = this;


        self.images = [];
        // [filename, site_id, dateTime]
        self.images[0] = ["1.jpg", 402, "2010-10-14 00:00:00"];
        self.images[1] = ["2.jpg", 312, "2010-08-01 12:00:00"];
        self.images[2] = ["3.jpg", 399, "2010-10-30 15:00:00"];
        self.images[3] = ["4.jpg", 402, "2010-10-14 00:03:00"];


        self.temp = new Set();

        // expand the full path
        self.images = self.images.map(img => {
            img[0] = paths.site.assets.backgrounds.citizenScience + img[0];
            return img;
        });


        /**
         * Temporary function that sets the current background based one or more parameters
         * Determines the best background image for the given arguments by checking a hardcoded json
         * This will be replaced with an api call in the future
         * @param site
         * @param audioRecordingId
         * @param hour
         */
        self.setBackgroundImageForItem = function (audioRecording, offsetSeconds) {

            //console.log("---------");
            //console.log(audioRecording.siteId, audioRecording.recordedDate, offsetSeconds);
            var segmentDate = new Date(audioRecording.recordedDate.getTime() + offsetSeconds * 1000);
            //self.temp.add(`siteID: ${audioRecording.siteId}, date: ${segmentDate}`);
            //console.log(self.temp);
            //console.log("---------");


            // order images by sitematch then time difference (rounded to 3 hours), then date difference
            // not perfect - but this is only temporary
            self.images.sort(function(a,b) {

                // sort by site match
                var siteMatchA = (a[1] === audioRecording.siteId);
                var siteMatchB = (b[1] === audioRecording.siteId);

                if (siteMatchA && !siteMatchB) {
                    return -1;
                } else if (siteMatchB && !siteMatchA) {
                    return 1;
                }

                // sort by time of day difference
                var dateA = new Date(a[2]);
                var dateB = new Date(b[2]);
                var segmentHours = segmentDate.getHours();

                var timeDifferenceA =  Math.abs(Math.round(((dateA.getHours() - segmentHours) / 3)));
                var timeDifferenceB =  Math.abs(Math.round(((dateB.getHours() - segmentHours) / 3)));

                if (timeDifferenceA < timeDifferenceB) {
                    return -1;
                } else if (timeDifferenceB > timeDifferenceA) {
                    return 1;
                }

                segmentDate.getHours();


                var dateDifferenceA = Math.abs(dateA.getTime() - segmentDate.getTime());
                var dateDifferenceB = Math.abs(dateB.getTime() - segmentDate.getTime());


                if (dateDifferenceA < dateDifferenceB) {
                    return -1;
                } else if (dateDifferenceB > dateDifferenceA) {
                    return 1;
                }

                return 0;

            });

            var bestImage = self.images[0][0];

            console.log(bestImage, bestImage, segmentDate, audioRecording.Site);

            self.currentBackground = bestImage;

        };






        return {
            currentBackground: currentBackground,
            setBackgroundImageForItem: self.setBackgroundImageForItem
        };
    }])
    .component("background", {
        template: `<div ng-repeat='background in backgrounds' ng-if="background.state !== 'finished'" class='background {{background.state}}' style='background-image:url({{background.url}});'></div>`,
        controller: ["$scope", "backgroundImage", "$timeout", function ($scope, backgroundImage, $timeout) {

            var self = this;

            $scope.backgrounds = [];

            /**
             * Watches for changes to the backgroundImage service. When a change is detected it
             * adds to the backgrounds array on scope. The array holds the url and the 'state'. State can be
             * preloading, fadeIn, done and finished.
             * preloading: image is preloading. Set the opacity to 0
             * fadeIn: image has been preloaded, fade it in.
             * done: image is finished fading in. Anything behind it can be removed.
             * finished: is behind an image with state done. Remove it from dom.
             * The backgrounds array is bound to scope in a repeat. New images can be added quicker than they can fade in without problem
             * because it just adds them over the top of the existing fading-in images.
             * @param newUrl
             * @param oldUrl
             */

            self.setBackground = function () {

                if (typeof backgroundImage.currentBackground !== "string" || backgroundImage.currentBackground.length === 0) {
                    return;
                }

                $scope.backgrounds.push({
                    url: backgroundImage.currentBackground,
                    state: "preloading"
                });

                var currentBackgroundNum = $scope.backgrounds.length - 1;

                var preload = new Image();
                preload.src = backgroundImage.currentBackground;

                if (preload.complete) {
                    self.backgroundLoaded(currentBackgroundNum);
                } else {
                    preload.addEventListener("load", function (e) {
                        self.backgroundLoaded(currentBackgroundNum);
                        // remove the preloaded image element to prevent memory leak
                        this.remove();
                    });
                    preload.addEventListener("error", function () {
                        console.warn("Error loading background image", this);
                        this.remove();
                    });
                }

            };

            /**
             * updates the state of the newly created background so that the dom element fades in
             */
            self.backgroundLoaded = function (backgroundNum) {
                // short timeout to ensure new background is loaded before start to fade in
                $timeout(function () {
                    $scope.backgrounds[backgroundNum].state = "fadeIn";
                }, 50);

                // timout to change do done after finished fading in.
                // Fade-in is done with css, and it seems easier to use timeout than using an event for the transition complete.
                // Need to make sure the timeout duration is longer than the transition duration
                $timeout(function () {
                    // because this is a timeout, it won't the state change won't be picked up by the bound template
                    // but it doesn't matter. This is just for checking what can be removed.
                    $scope.backgrounds[backgroundNum].state = "done";
                    self.cleanup();
                }, 1000);
            };


            /**
             * Removes all backgrounds from the list that are before (lower index) any with state 'done'
             */
            self.cleanup = function () {

                var discard = false;
                for (var i = $scope.backgrounds.length - 1; i >= 0; i--) {

                    if (discard) {
                        $scope.backgrounds[i].state = "finished";
                    } else if ($scope.backgrounds[i].state === "done") {
                        discard = true;
                    }
                }
            };

            $scope.$watch(function () {
                return backgroundImage.currentBackground;
            }, function (newVal, oldVal) {
                self.setBackground();
            });

        }]
    });
