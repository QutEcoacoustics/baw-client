angular.module(
    "bawApp.directives.ui.bootstrap.pagination",
    ["ui.bootstrap.pagination"])
    .run([
        "$templateCache",
        function($templateCache) {
            // add ng-href and remove ng-click
            const
                targetTemplate = "uib/template/pagination/pagination.html",
                pageRegex = /(href).*(?:ng-click="selectPage\(([^,]+), \$event\)")/gm,
                replaceString = `ng-href="{{ pagination.href($2) }}" href`;

            var oldTemplate = $templateCache.get(targetTemplate);

            var newTemplate = oldTemplate.replace(pageRegex, replaceString);

            $templateCache.put(targetTemplate, newTemplate);
        }])
    .directive("paginationHref", ["$parse", function($parse) {
        return {
            require: ["uibPagination"],
            controller: "UibPaginationController",
            controllerAs: "pagination",
            replace: true,
            link: function(scope, element, attrs, ctrls) {
                var paginationCtrl = ctrls[0];
                let parentScope = scope;

                // this is dodgy AF but its the only way i can think of to get
                // the instance for which the actual expression is attached!
                let parts = attrs.paginationHref.split(".");
                let parent = parentScope;
                if (parts.length > 1) {
                    parts.splice(-1, 1);
                    let parentExpression = parts.join(".");
                    parent = $parse(parentExpression)(parentScope);
                }

                let f = $parse(attrs.paginationHref)(parentScope);
                paginationCtrl.href = function (...args) {
                    return f.apply(parent, args);
                };
            }
        };
    }]);



