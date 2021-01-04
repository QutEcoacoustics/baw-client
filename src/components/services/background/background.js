angular.module("bawApp.components.background", [])
    .service("backgroundImage", ["conf.paths", "$http", function (paths, $http) {

        var self = this;

        self.currentBackground = "";
        self.images = [];

        /**
         * array of images, with their site and datetime.
         * This is a temporary solution. In the future this will be incorporated into the server
         */
        $http.get(paths.site.assets.citizenScience.backgrounds.lookup).then(response => {
            // expand the full path
            self.images = response.data.map(img => {
                img.filename = paths.site.assets.citizenScience.backgrounds.files + img.filename;
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

            var bestImage = self.images[0];
            self.currentBackground = bestImage.filename;

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
             * preloading, fadeIn, done, fadeOut.
             * preloading: image is preloading. Set the opacity to 0
             * fadeIn: image has been preloaded, fade it in.
             * done: image is finished fading in. Anything behind it can be removed.
             * fadeOut: used only when there is no background image. image should fade out and then the array is cleared
             * The order of the images in the array is the order on the page from behind to in front.
             * The backgrounds array is bound to scope in a repeat. New images can be added quicker than they can fade in without problem
             * because it just adds them over the top of the existing fading-in images.
             * The fading is done in css
             * @param newUrl
             * @param oldUrl
             */

            self.setBackground = function () {

                // If the new background is empty, fade any current background out then remove any 'fadeOut' backgrounds
                if (typeof backgroundImage.currentBackground !== "string" || backgroundImage.currentBackground.length === 0) {
                    // remove the background
                    $scope.backgrounds.forEach(bg => bg.state = "fadeOut");
                    $timeout(function () {
                        // after the fadeOut time, remove any items that are of type fadeOut
                        // the code below acts like a filter-in-place function
                        let j = 0;
                        $scope.backgrounds.forEach((e, i) => {
                            if (e.state !== "fadeOut") {
                                if (i!==j) {
                                    $scope.backgrounds[j] = e;
                                }
                                j++;
                            }
                        });
                        $scope.backgrounds.length = j;
                    }, 1000);

                } else {
                    // If the new background is not empty, add the new background to the top and fade it in, then
                    // clean up any old background when its done fading in.

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

                }

            };

            /**
             * updates the state of the newly created background so that the dom element fades in
             */
            self.backgroundLoaded = function (backgroundNum) {
                let background = $scope.backgrounds[backgroundNum];
                // short timeout to ensure new background is loaded before start to fade in
                $timeout(function () {
                    background.state = "fadeIn";
                }, 50);
                // timout to change to "done" after fade in and remove any backgrounds below it.
                // Fade-in is done with css, and it seems easier to use timeout than using an event for the transition complete.
                // The timeout duration must be longer than the transition duration
                $timeout(function () {
                    // because this is a timeout, it won't immediately have an effect on the dom, but the fade-ins have
                    // completed so it's ok.
                    if (background.state !== "fadeOut") {
                        background.state = "done";
                        const discardBelow = $scope.backgrounds.indexOf(background);
                        $scope.backgrounds.splice(0, discardBelow);
                    }
                }, 1000);
            };

            $scope.$watch(function () {
                return backgroundImage.currentBackground;
            }, function (newVal, oldVal) {
                self.setBackground();
            });


            /**
             * When the route changes, check if the new route should have a background. If not, remove the current background
             */
            $scope.$on("$routeChangeStart", function(event, next) {
                if (!next.$$route || !next.$$route.hasOwnProperty("hasBackground") || !next.$$route.hasBackground) {
                    backgroundImage.currentBackground = "";

                    if (!next.$$route) {
                        console.warn("AngularJS router not detected");
                    }
                }
            });

            /**
             * Debugging function to print the list of states in one line of text
             */
            self.printStates = function (context = "") {
                console.log(">>>> ",context, "(", $scope.backgrounds.length, ") [", $scope.backgrounds.map(bg => bg.state).join(", "), "]");
            };


        }]
    });
