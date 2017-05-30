var scaleToFit = angular.module("bawApp.directives.scaleToFit", []);


scaleToFit.directive("scaleToFit",
    ["$window",
        function ($window) {

            return {
                restrict: "A",
                link: function (scope, $element) {


                    var el = $element[0];

                    // var realWidth = el.clientWidth;
                    // var realHeight = el.clientHeight;

                    function scale () {

                        if (!el || !el.offsetParent) {
                            return;
                        }

                        var parentWidth = el.offsetParent.clientWidth;
                        var parentHeight = el.offsetParent.clientHeight;

                        var realWidth = el.clientWidth;
                        var realHeight = el.clientHeight;

                        var widthRatio = realWidth / parentWidth;
                        var heightRatio = realHeight / parentHeight;

                        var ratio = Math.min(heightRatio, widthRatio, 1);

                        el.style.transform = "scale("+ratio+")";
                        el.style.transformOrigin = "left";

                    }

                    console.log("resize to fit scope id", scope.$id, el);

                    //scale();

                    angular.element($window).bind("resize", scale);

                }
            };
        }]);