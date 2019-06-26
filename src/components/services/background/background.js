angular.module("bawApp.components.background", [])
    .service("backgroundImage", ["conf.paths", "$http", function (paths, $http) {

        var self = this;

        self.currentBackground = "";
        self.images = [];

        /**
         * array of images, with their site and datetime.
         * This is a temporary solution. In the future this will be incorporated into the server
         */
        $http.get("/public/citizen_science/samples/images.json").then(response => {
            // expand the full path
            self.images = response.data.map(img => {
                img.filename = paths.site.assets.backgrounds.citizenScience + img.filename;
                return img;
            });
        });

        /**
         * Sets the current background. Chooses the best image for a given site/datetime.
         * This is a temporary solution and will eventually be done on the server.
         * @param audioRecording AudioRecording, containing a siteId and recordedDate
         * @param offsetSeconds
         */
        self.setBackgroundImageForItem = function (audioRecording, offsetSeconds) {

            if (self.images.length === 0) {
                return;
            }

            var segmentDate = new Date(audioRecording.recordedDate.getTime() + offsetSeconds * 1000);


            // order images by
            // - whether the site matches
            // - time of day difference (rounded to 3 hours)
            // - then date difference
            // not perfect - but this is only temporary
            self.images.sort(function(a,b) {

                // sort by site match
                var siteMatchA = (a.siteId === audioRecording.siteId);
                var siteMatchB = (b.siteId === audioRecording.siteId);

                if (siteMatchA && !siteMatchB) {
                    return -1;
                } else if (siteMatchB && !siteMatchA) {
                    return 1;
                }

                // returns the difference in time of day to the nearest 3 hours
                // ignoring date information but accounting for date1 and date2 being
                // on different days (e.g. 2am - 23pm = 3)
                var getHourDifference = function (date1, date2) {
                    var difference = Math.abs(date1.getHours() - date2.getHours());
                    difference = Math.min(difference, 24 - difference);
                    return Math.round(difference / 3) * 3;
                };

                // same site, so sort by time of day difference
                var dateA = new Date(a.date);
                var dateB = new Date(b.date);

                var hourDifferenceA =  getHourDifference(dateA, segmentDate);
                var hourDifferenceB =  getHourDifference(dateB, segmentDate);

                if (hourDifferenceA < hourDifferenceB) {
                    return -1;
                } else if (hourDifferenceB > hourDifferenceA) {
                    return 1;
                }

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
            self.currentBackground = bestImage;

        };

        return {
            currentBackground: self.currentBackground,
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
