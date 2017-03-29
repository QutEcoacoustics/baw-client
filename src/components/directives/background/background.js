angular.module("bawApp.components.background", [])
    .component("background",{
        template: "<div class='background bgBottom' style='background-image:url({{bgBack}});'></div>" +
                  "<div class='background bgTop' style='background-image:url({{bgFront}});' ng-class='state'></div>",
        controller: ["$scope", "$rootScope", "$window", "$element", "$interval", function ($scope, $rootScope, $window, $element, $interval) {

            var self = this;

            self.setBg = function (newUrl, oldUrl) {

                $scope.bgFront = oldUrl;

                $scope.state = "preloading";

                var preload = new Image();
                preload.src = newUrl;

                if (preload.complete) {
                    self.bgLoaded(newUrl);
                } else {
                    preload.addEventListener("load", function (e) {
                        self.bgLoaded(e.srcElement.src);
                    });
                    preload.addEventListener("error", function() {
                        console.log("Error loading background image");
                    });
                }

            };

            self.bgLoaded = function (newUrl) {

                console.log("next bg image loaded", newUrl);

                $scope.bgBack = newUrl;

                $scope.state = "ready";
            };


            $rootScope.$watch("bgImageSource", function (newval, oldval) {

                console.log("background image source changed", newval);

                self.setBg(newval, oldval);

            });

        }]
    });
