angular.module("bawApp.components.background", [])
    .component("csBackgrounds",{
        template: "<div fill-window class='csBackgroundWrapper'><img cs-background ng-repeat='background in $ctrl.backgroundPaths' class='csBackground'  ng-src='{{background}}' /></div>",
        controller: ["$scope", "$window", "$element", function ($scope, $window, $element) {
            //console.log("dataset progress component scope");console.log($scope);

            var self = this;

            self.pathToBackgrounds = "/build/assets/img/citizen-science/backgrounds/";
            self.backgroundPaths = [];

            self.setBackgrounds = function () {
                for (var b = 0; b < self.backgrounds.length; b++) {
                    self.backgroundPaths[b] = self.pathToBackgrounds + self.backgrounds[b];
                }
            };
            self.setBackgrounds();




            // self.currentBackgroundNum = 0;
            // self.changeBackground = function () {
            //     self.currentBackgroundNum++;
            //     self.currentBackground = "/build/assets/img/citizen-science/backgrounds/" + self.backgrounds[self.currentBackgroundNum % self.backgrounds.length];
            // };
            // self.changeBackground();

            self.$onInit = function () {
                //self.resize();
                console.log("start");
            };





        }],
        bindings: {
            backgrounds: "<",
        }
    })
    .directive("csBackground", ["$window", function ($window) {
        return {
            restrict: "A",
            link: function (scope, element, attrs) {

                var self = this;

                self.element = element[0];


                element.bind("load", function () {
                    self.resize();
                });
                element.bind("error", function () {
                    console.log("background image could not be loaded");
                });


                self.resize = function () {

                    // if aspect ratio (width/height) of image is larger (wider) than window"s, match height
                    // otherwise match width

                    if (self.element.naturalHeight === 0) {
                        return;
                    }

                    var imgAspectRatio = self.element.naturalWidth / self.element.naturalHeight;
                    var windowAspectRatio = $window.innerWidth / $window.innerHeight;
                    var newHeight, newWidth;

                    if (imgAspectRatio > windowAspectRatio) {
                        // image is wider ratio than window, match height
                        newHeight = $window.innerHeight;
                        newWidth = newHeight * imgAspectRatio;
                    } else {
                        newWidth = $window.innerWidth;
                        newHeight = newWidth / imgAspectRatio;
                    }

                    angular.element(self.element).css("height", newHeight + "px");
                    angular.element(self.element).css("width", newWidth + "px");


                };

                angular.element($window).bind("resize", function () {
                    self.resize();
                    console.log(
                        "window resized"
                    );
                });

            }
        };
    }])
    .directive("fillWindow", ["$window", function ($window) {
        return {
            restrict: "A",
            link: function (scope, element, attrs) {
                var self = this;
                self.element = element[0];
                element.bind("load", function () {
                    self.resize();
                });
                self.resize = function () {
                    var newHeight = $window.innerHeight - 20;
                    var newWidth = $window.innerWidth - 20;
                    angular.element(self.element).css("height", newHeight + "px");
                    angular.element(self.element).css("width", newWidth + "px");
                    // todo: position top left to top left of window
                };
                angular.element($window).bind("resize", function () {
                    self.resize();
                    console.log(
                        "window resized"
                    );
                });
            }
        };
    }]);