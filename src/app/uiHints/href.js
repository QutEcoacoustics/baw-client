angular
    .module("bawApp.uiHints.bawHref", [])
    .directive(
    "bawHref",
    [
        "$parse",
        "conf.paths",
        function($parse, paths) {
            const
                bawHref = "bawHref",
                hrefAttribute = "href",
                targetAttribute = "target";

            return {
                restrict: "A",
                priority: 100,
                link: function(scope, element, attr) {
                    var shouldSetTarget = !attr.$attr[targetAttribute];
                    //scope.$watch(attr[bawHref], attrChange);
                    attr.$observe(attr[bawHref], attrChange);

                    // need to trigger the first time...
                    attrChange(attr[bawHref]);

                    function attrChange(value) {
                        let target,
                            path = value;
                        if (value) {
                            // TODO: add ability to interpolate path strings

                            // dodgy check assumes a string
                            let isServerPath = value.indexOf("api") === 0;
                            if (isServerPath) {
                                // target _self will cause a full page reload and thus allows routing to server
                                // UI if necessary.
                                // https://docs.angularjs.org/guide/$location
                                target = "_self";

                                path = scope.$eval(value + "Absolute", paths);
                            }
                            else {
                                path = scope.$eval(value, paths);
                            }
                        }

                        attr.$set(hrefAttribute, path);

                        if (shouldSetTarget) {
                            attr.$set(targetAttribute, target);
                        }
                    }
                }
            };
        }
    ]);
