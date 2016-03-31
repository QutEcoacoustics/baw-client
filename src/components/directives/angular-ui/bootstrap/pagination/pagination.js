angular.module(
    "bawApp.directives.ui.bootstrap.pagination",
    [])
    .run([
        "$templateCache",
        function($templateCache) {
            // add ng-href and remove ng-click
            const
                targetTemplate = "uib/template/pagination/pagination.html",
                pageRegex = /(href).*(?:ng-click="selectPage\(([^,]+), \$event\)")/gm,
                replaceString = `ng-href="{{ $parent.$parent.getPaginationLink($2) }}" href`;

            var oldTemplate = $templateCache.get(targetTemplate);

            var newTemplate = oldTemplate.replace(pageRegex, replaceString);

            $templateCache.put(targetTemplate, newTemplate);
        }]);


