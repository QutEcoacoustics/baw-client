angular.module("bawApp.components.background", [])
    .service("bgImage", function() {
        var curBg = "";
        return {
            curBg: curBg
        };
    })
    .component("background",{
        template: "<div ng-repeat='bg in bgs' ng-if=\"bg.state !== 'finished'\" class='background {{bg.state}}' style='background-image:url({{bg.url}});'></div>",
        controller: ["$scope", "bgImage", function ($scope, bgImage) {

            var self = this;

            $scope.bgs = [];

            /**
             * Watches for changes to the bgImage service. When a change is detected it
             * adds to the bgs array on scope. The array holds the url and the 'state'. State can be
             * preloading, fadeIn, done and finished.
             * preloading: image is preloading. Set the opacity to 0
             * fadeIn: image has been preloaded, fade it in.
             * done: image is finished fading in. Anything behind it can be removed.
             * finished: is behind an image with state done. Remove it from dom.
             * The bgs array is bound to scope in a repeat. New images can be added quicker than they can fade in without problem
             * because it just adds them over the top of the existing fading-in images.
             * @param newUrl
             * @param oldUrl
             */

            self.setBg = function () {

                if (typeof bgImage.curBg !== "string" || bgImage.curBg.length === 0) {
                    return;
                }

                $scope.bgs.push({
                    url : bgImage.curBg,
                    state : "preloading"
                });

                var curBgNum = $scope.bgs.length - 1;

                var preload = new Image();
                preload.src = bgImage.curBg;

                    if (preload.complete) {
                        self.bgLoaded(curBgNum);
                    } else {
                        preload.addEventListener("load", function (e) {
                            self.bgLoaded(curBgNum);
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
            self.bgLoaded = function (bgNum) {
                setTimeout(function () {
                    $scope.bgs[bgNum].state = "fadeIn";
                }, 50);
                setTimeout(function () {

                    // because this is a timeout, it won't the state change won't be picked up by the bound template
                    // but it doesn't matter. This is just for checking what can be removed.
                    // timeout duration must be longer than the css fade in transition.
                    $scope.bgs[bgNum].state = "done";
                    self.cleanupBgs();
                }, 1000);
            };


            /**
             * Removes all bgs from the list that are before (lower index) any with state 'done'
             */
            self.cleanupBgs = function () {

                var discard = false;
                for (var i = $scope.bgs.length - 1; i >= 0; i--) {

                    if (discard) {
                        $scope.bgs[i].state = "finished";
                    } else if ($scope.bgs[i].state === "done") {
                        discard = true;
                    }
                }
            };

            $scope.$watch(function () {
                return bgImage.curBg;
            }, function (newVal, oldVal) {
                self.setBg();
            });

        }]
    });
