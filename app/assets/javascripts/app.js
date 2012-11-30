'use strict';

/* App Module */

// global definition
var bawApp = (function () {
    var exports = {

    };

    // Helper function


    function whenDefaults(resourceName, singularResourceName, id, controllerMany, controllerOne, addManageView) {
        var path = "/" + resourceName;
        var detailsPath = path + "/" + id;
        var asset = "/assets/" + resourceName + "_index.html";
        var asset_details = "/assets/" + singularResourceName + "_details.html";

        return this
            // many
            .when(path, {templateUrl: asset, controller: controllerMany})
            // manage
            .fluidIf(addManageView, function () {
                this.when(path + "/manage", {templateUrl: asset.replace("index.html", "manager.html"), controller: controllerMany})
            })
            // details
            .when(detailsPath, {templateUrl: asset_details, controller: controllerOne})
            // create
            .when(path + "/create", {templateUrl: asset_details, controller: controllerOne})
            // edit
            .when(detailsPath + "/:editing", {templateUrl: asset_details, controller: controllerOne})
            ;
    }

    var app = angular.module('baw',
        [
            'ngResource',
            'ui.directives',            /* angular-ui project */
            'ui.filters',               /* angular-ui project */
            'bawApp.directives',        /* our directives.js  */
            'bawApp.filters',           /* our filters.js     */
            'baw.services',             /* our services.js    */
            'http-auth-interceptor'     /* the auth module    */
        ]);

    app.config(function ($routeProvider, $locationProvider) {
        $routeProvider.whenDefaults = whenDefaults;
        $routeProvider.fluidIf = fluidIf;

        // routes
        $routeProvider.
            when('/home', {templateUrl: '/assets/home.html', controller: HomeCtrl}).

//                when('/projects', {templateUrl: '/assets/projects_index.html', controller: ProjectCtrl}).
//                when('/projects/manage', {templateUrl: '/assets/projects_manager.html', controller: ProjectsCtrl}).
//                when('/projects/:projectId', {templateUrl: '/assets/project_details.html', controller: ProjectsCtrl}).
//                when('/projects/:projectId/:editing', {templateUrl: '/assets/project_details.html', controller: ProjectsCtrl}).
            whenDefaults("projects", "project", ":projectId", ProjectsCtrl, ProjectCtrl, true).

            when('/sites', {templateUrl: '/assets/sites.html', controller: SitesCtrl }).
            when('/sites/:siteId', {templateUrl: '/assets/site.html', controller: SiteCtrl }).

            when('/photos', {templateUrl: '/assets/photos.html', controller: PhotosCtrl }).
            when('/photos/:photoId', {templateUrl: '/assets/photo.html', controller: PhotoCtrl }).

            when('/recordings', {templateUrl: '/assets/recordings.html', controller: RecordingsCtrl }).
            when('/recordings/:recordingId', {templateUrl: '/assets/recording.html', controller: RecordingCtrl }).

            when('/listen', {templateUrl: '/assets/listen.html', controller: ListenCtrl}).
            when('/listen/:recordingId', {templateUrl: '/assets/listen.html', controller: ListenCtrl}).

            whenDefaults("searches", "search", ":searchId", SearchesCtrl, SearchCtrl, true).
            when('/search', {templateUrl: '/assets/search_details.html', controller: SearchCtrl}).

            when('/accounts', {templateUrl: '/assets/accounts_sign_in.html', controller: AccountsCtrl}).
            when('/accounts/:action', {templateUrl: '/assets/accounts_sign_in.html', controller: AccountsCtrl}).

            when('/attribution', {templateUrl: '/assets/attributions.html'}).

            //when('/phones/:phoneId', {templateUrl: 'partials/phone-detail.html', controller: PhoneDetailCtrl}).
            when('/', {templateUrl: '/assets/home.html', controller: HomeCtrl}).
            when('/404', {controller: ErrorCtrl}).
            when('/404?path=:errorPath', {controller: ErrorCtrl}).
            otherwise(
            {redirectTo: function (params, location, search) {
                return '/404?path=' + location;
            }
            });

        // location config
        $locationProvider.html5Mode(true);
    });

    app.run(['$rootScope', '$location', '$route', '$http', function ($rootScope, $location, $route, $http) {
        exports.print = $rootScope.print = function () {
            var seen = [];
            var badKeys = ["$digest", "$$watchers", "$$childHead", "$$childTail", "$$listeners", "$$nextSibling", "$$prevSibling", "$root", "this", "$parent"];
            var str = JSON.stringify(this,
                (function (key, val) {
                    if (badKeys.indexOf(key) >= 0) {
                        return "[Can't do that]";
                    }
                    if (typeof val == "object") {
                        if (seen.indexOf(val) >= 0) {
                            return "";
                        }
                        seen.push(val);
                    }
                    return val;
                }), 4);
            return str;
        };
        $rootScope.showOrHideDebugInfo = false;


        // http://www.yearofmoo.com/2012/10/more-angularjs-magic-to-supercharge-your-webapp.html#apply-digest-and-phase
        $rootScope.$safeApply = function ($scope, fn) {
            $scope = $scope || $rootScope;
            fn = fn || function () {
            };
            if ($scope.$$phase) {
                fn();
            }
            else {
                $scope.apply(fn);
            }
        };

        $rootScope.$on("$routeChangeError", function (event, current, previous, rejection) {
            console.warn("route changing has failed... handle me some how");
            //change this code to handle the error somehow
            $location.path('/404/' + $location.path);
        });

        // reload a view and controller (shortcut for full page refresh)
        $rootScope.$reloadView = function () {
            $route.reload();
        };

        // STANDARD DATE FORMAT
        $rootScope.dateOptions = {
            changeMonth: true,
            changeYear: true,
            dateFormat: "yy-mm-dd",
            duration: "fast",
            yearRange: "1800:3000"

        };


    }]);

    return exports;
})();
