angular.module("bawApp.components.background", [])
    .service("backgroundImage", function () {
        var currentBackground = "";
        return {
            currentBackground: currentBackground
        };
    })
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
