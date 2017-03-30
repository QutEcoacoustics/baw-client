angular.module("bawApp.components.background", [])
    .component("background",{
        template: "<div class='background bgBottom' style='background-image:url({{bgBack}});'></div>" +
                  "<div class='background bgTop' style='background-image:url({{bgFront}});' ng-class='state'></div>",
        controller: ["$scope", "$rootScope", "$window", "$element", "$interval", function ($scope, $rootScope, $window, $element, $interval) {

            var self = this;

            /**
             * Loads the old url into the back bg div (so, two copies of the same image one behind the other)
             * Preloads image. When loaded, sets the state to 'ready', which is opacity 1 with transition.
             * Then, loads the new url into the front bg div.
             * Sets state of the front div to preloading, which is opacity 0 with no transition.
             * This will continue to show the old bg in the bgBack div.
             * This will fade in the new bg image infront of the old one.
             * @param newUrl
             * @param oldUrl
             */

            self.setBg = function (newUrl, oldUrl) {

                $scope.bgBack = oldUrl;
                $scope.state = "preloading";

                var preload = new Image();
                preload.src = newUrl;

                if (preload.complete) {
                    self.bgLoaded(newUrl);
                } else {
                    preload.addEventListener("load", function (e) {
                        self.bgLoaded(e.srcElement.src);
                        this.remove();
                    });
                    preload.addEventListener("error", function() {
                        console.warn("Error loading background image", this);
                        this.remove();
                    });
                }

            };

            /**
             * Updates the src of the front image and sets the state to ready, which
             * switches the opacity to 1. Called when the preloading is done.
             * @param newUrl
             */
            self.bgLoaded = function (newUrl) {
                $scope.bgFront = newUrl;
                setTimeout(function () {
                    $scope.state = "ready";
                }, 100);
            };

            $rootScope.$watch("bgImageSource", function (newval, oldval) {
                if (typeof newval !== "string") {
                    return;
                }
                self.setBg(newval, oldval);

            });

        }]
    });
