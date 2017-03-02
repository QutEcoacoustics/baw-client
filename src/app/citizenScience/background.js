angular.module("bawApp.components.background", [])
    .component("csBackgrounds",{
        template: "<div fill-window class='csBackgroundWrapper'>" +
            "<div " +
            "ng-repeat='(num, background) in $ctrl.backgroundPaths' " +
            "ng-class=\"{bgActive : $ctrl.curBackgroundNum===num}\" " +
            "class='csBackground'  " +
            "style='background-image:url({{background}});' /></div>" +
            "</div>",
        controller: ["$scope", "$window", "$element", "$interval", function ($scope, $window, $element, $interval) {

            var self = this;

            /**
             * location of all images, to be concatenated with the files specified as attributes
             * @type {string}
             */
            self.pathToBackgrounds = "/build/assets/img/citizen-science/backgrounds/";
            self.backgroundPaths = [];

            self.curBackgroundNum = 0;

            /**
             * creates a full path to each background image based on the specified list of files
             * and the path to the backgrounds directory
             */
            self.setBackgrounds = function () {
                for (var b = 0; b < self.backgrounds.length; b++) {
                    self.backgroundPaths[b] = self.pathToBackgrounds + self.backgrounds[b];
                }
            };
            self.setBackgrounds();

            /**
             * increments the curBackgroundNum, cycling to the start if necessary
             */
            self.cycleChange = function () {
                self.curBackgroundNum = (self.curBackgroundNum + 1) % self.backgrounds.length;
            };


            if (self.changeEveryMS > 0) {
                self.cycleInterval = $interval(self.cycleChange, self.changeEveryMS);
            } else if (self.changeOn !== undefined) {
                $scope.$watch(function () { return self.changeOn; }, function (oldval, newval) {
                    self.cycleChange();
                });
            }

        }],
        bindings: {
            backgrounds: "<",
            // if set will watch for changes to this variable and cycle background image then
            changeOn: "<",
            // if set will cycle background image every this many seconds
            changeEveryMS: "<"
        }
    })

    .directive("fillWindow", ["$window", function ($window) {
        return {
            restrict: "A",
            link: function (scope, element, attrs) {
                var self = this;
                self.element = element[0];
                element.bind("load", function () {
                    self.resize();
                });

                /**
                 * called after page load or resize
                 * updates the size and position of the bound element
                 */
                self.resize = function () {
                    var newHeight = $window.innerHeight - 5;
                    var newWidth = $window.innerWidth - 5;

                    angular.element(self.element.parentElement).css("position","relative");

                    var css = {
                        "height": newHeight + "px",
                        "width": newWidth + "px",
                        "top": (2-self.element.parentElement.getBoundingClientRect().top) + "px",
                        "left": (2-self.element.parentElement.getBoundingClientRect().left) + "px"
                    };

                    angular.element(self.element).css(css);

                };
                scope.$watch(function () {
                    return self.element.parentElement.getBoundingClientRect().right;
                }, function (oldVal, newVal) {
                    self.resize();
                });
                self.resize();
                angular.element($window).bind("resize", function () {
                    self.resize();
                });
            }
        };
    }]);