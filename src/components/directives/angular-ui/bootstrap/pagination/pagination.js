angular.module(
    "bawApp.directives.ui.bootstrap.pagination",
    [])
.run([
        "$templateCache",
        function($templateCache) {
            // override bootstrap-ui's default template
            var newTemplate = $templateCache.get("components/directives/angular-ui/bootstrap/pagination/pagination.tpl.html");
            $templateCache.put("template/pagination/pagination.html", newTemplate);
    }]);


